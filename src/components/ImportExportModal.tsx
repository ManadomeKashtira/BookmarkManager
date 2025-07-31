
import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Shield, Database } from 'lucide-react';
import type { Bookmark, Category, AppSettings, SortOption, CompleteBackupData } from '@/types/bookmark';
import { defaultFaviconName } from '@/lib/icons';
import { createCompleteBackup, exportBackupFile, parseBackupFile } from '@/lib/backupService';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  categories: Category[];
  settings: AppSettings;
  userPreferences: {
    selectedCategory: string;
    searchQuery: string;
    viewMode: 'grid' | 'list';
    sortBy: SortOption;
  };
  onImportBookmarks: (bookmarks: Bookmark[]) => void;
  onRestoreCompleteBackup: (backupData: CompleteBackupData) => void;
  mode: 'import' | 'export';
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  bookmarks: currentBookmarks,
  categories,
  settings,
  userPreferences,
  onImportBookmarks,
  onRestoreCompleteBackup,
  mode
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModalState = () => {
    setDragActive(false);
    setImportStatus('idle');
    setImportMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  if (!isOpen) return null;

  const handleCompleteBackup = () => {
    const backupData = createCompleteBackup(
      currentBookmarks,
      categories,
      settings,
      userPreferences
    );
    exportBackupFile(backupData);
    handleClose();
  };

  const handleExport = (format: 'json' | 'csv' | 'html') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    const bookmarksToExport = currentBookmarks.map(b => ({
        ...b,
        dateAdded: b.dateAdded instanceof Date ? b.dateAdded.toISOString() : new Date(b.dateAdded).toISOString(),
        dateModified: b.dateModified instanceof Date ? b.dateModified.toISOString() : new Date(b.dateModified).toISOString(),
    }));


    switch (format) {
      case 'json':
        content = JSON.stringify(bookmarksToExport, null, 2);
        filename = 'bookmarks.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        const csvHeaders = 'Title,URL,Description,Category,Tags,Favorite,Date Added,Visits,Favicon\n';
        const csvRows = bookmarksToExport.map(b => 
          [
            `"${b.title.replace(/"/g, '""')}"`,
            `"${b.url.replace(/"/g, '""')}"`,
            `"${(b.description || '').replace(/"/g, '""')}"`,
            `"${b.category.replace(/"/g, '""')}"`,
            `"${b.tags.join(';').replace(/"/g, '""')}"`,
            `"${b.isFavorite}"`,
            `"${b.dateAdded}"`,
            `"${b.visits}"`,
            `"${(b.favicon || '').replace(/"/g, '""')}"`
          ].join(',')
        ).join('\n');
        content = csvHeaders + csvRows;
        filename = 'bookmarks.csv';
        mimeType = 'text/csv';
        break;
      case 'html': // Keep HTML export for now, just remove import.
        const htmlDocContent = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks Menu</H1>
<DL><p>
    ${bookmarksToExport.map(b => {
        const dateAddedTimestamp = Math.floor(new Date(b.dateAdded).getTime() / 1000);
        return `<DT><A HREF="${b.url}" ADD_DATE="${dateAddedTimestamp}" LAST_MODIFIED="${dateAddedTimestamp}" ${(b.favicon && (b.favicon.startsWith('http') || b.favicon.startsWith('data:image'))) ? `ICON="${b.favicon}"` : ''}>${b.title}</A>${b.description ? `\n<DD>${b.description}` : ''}`;
    }).join('\n    <p>\n')}
</DL><p>`;
        content = htmlDocContent;
        filename = 'bookmarks.html';
        mimeType = 'text/html';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    handleClose();
  };

  const parseHtmlBookmarks = (htmlContent: string): any[] => {
    const bookmarks: any[] = [];

    try {
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Check if it's a valid bookmark file
      if (!htmlContent.includes('NETSCAPE-Bookmark-file') && !htmlContent.includes('<A HREF=')) {
        throw new Error('This does not appear to be a valid HTML bookmark file.');
      }

      // Function to recursively parse bookmark structure
      const parseNode = (node: Element, currentFolder: string = '') => {
        const children = Array.from(node.children);

        for (let i = 0; i < children.length; i++) {
          const child = children[i];

          if (child.tagName === 'DT') {
            const link = child.querySelector('A');
            const h3 = child.querySelector('H3');

            if (link) {
              // This is a bookmark
              const href = link.getAttribute('HREF') || '';
              const title = link.textContent?.trim() || 'Untitled';
              const addDate = link.getAttribute('ADD_DATE');
              const icon = link.getAttribute('ICON');

              // Get description from next DD element
              let description = '';
              const nextElement = children[i + 1];
              if (nextElement && nextElement.tagName === 'DD') {
                description = nextElement.textContent?.trim() || '';
              }

              if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('ftp://'))) {
                bookmarks.push({
                  title,
                  url: href,
                  description,
                  category: currentFolder || 'Imported',
                  tags: [],
                  isFavorite: false,
                  dateAdded: addDate ? new Date(parseInt(addDate) * 1000) : new Date(),
                  visits: 0,
                  favicon: icon && (icon.startsWith('data:image') || icon.startsWith('http')) ? icon : undefined
                });
              }
            } else if (h3) {
              // This is a folder
              const folderName = h3.textContent?.trim() || 'Folder';

              // Skip special folders like "Bookmarks bar", "Other bookmarks", etc. for cleaner import
              const skipFolders = ['bookmarks bar', 'bookmarks menu', 'other bookmarks', 'mobile bookmarks'];
              const isSpecialFolder = skipFolders.includes(folderName.toLowerCase());

              const newFolderPath = !isSpecialFolder && currentFolder ? `${currentFolder}/${folderName}` :
                                   !isSpecialFolder ? folderName : currentFolder;

              // Look for the next DL element which contains the folder contents
              const nextElement = children[i + 1];
              if (nextElement && nextElement.tagName === 'DL') {
                parseNode(nextElement, newFolderPath);
              }
            }
          } else if (child.tagName === 'DL') {
            // Continue parsing within this list
            parseNode(child, currentFolder);
          }
        }
      };

      // Start parsing from the document body
      const dlElements = doc.querySelectorAll('DL');
      dlElements.forEach(dl => parseNode(dl));

      if (bookmarks.length === 0) {
        throw new Error('No valid bookmarks found in the HTML file.');
      }

    } catch (error: any) {
      throw new Error(`Failed to parse HTML bookmarks: ${error.message}`);
    }

    return bookmarks;
  };

  const handleFileSelect = (file: File) => {
    setImportStatus('processing');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedData: any[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          importedData = Array.isArray(parsed) ? parsed : [parsed];
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split(/\r\n|\n/).filter(line => line.trim());
          if (lines.length < 2) throw new Error("CSV file must have headers and at least one data row.");

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
          const titleIndex = headers.indexOf('title');
          const urlIndex = headers.indexOf('url');
          const descriptionIndex = headers.indexOf('description');
          const categoryIndex = headers.indexOf('category');
          const tagsIndex = headers.indexOf('tags');
          const favoriteIndex = headers.indexOf('favorite');
          const dateAddedIndex = headers.indexOf('date added');
          const visitsIndex = headers.indexOf('visits');
          const faviconIndex = headers.indexOf('favicon');

          if (titleIndex === -1 || urlIndex === -1) {
            throw new Error("CSV must contain 'Title' and 'URL' columns.");
          }

          importedData = lines.slice(1).map(line => {
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
            return {
              title: values[titleIndex] || 'Untitled',
              url: values[urlIndex] || '',
              description: descriptionIndex > -1 ? values[descriptionIndex] : '',
              category: categoryIndex > -1 ? values[categoryIndex] : 'Imported',
              tags: tagsIndex > -1 && values[tagsIndex] ? values[tagsIndex].split(';').map((t: string) => t.trim()).filter(Boolean) : [],
              isFavorite: favoriteIndex > -1 ? ['true', '1', 'yes'].includes(values[favoriteIndex]?.toLowerCase()) : false,
              dateAdded: dateAddedIndex > -1 && values[dateAddedIndex] ? new Date(values[dateAddedIndex]) : new Date(),
              visits: visitsIndex > -1 ? parseInt(values[visitsIndex]) || 0 : 0,
              favicon: faviconIndex > -1 ? values[faviconIndex] : undefined,
            };
          });
        } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          // Parse HTML bookmark file (Netscape format)
          importedData = parseHtmlBookmarks(content);
        } else if (file.name.endsWith('.bk')) {
          // Parse complete backup file
          const backupResult = parseBackupFile(content);
          if (!backupResult.success) {
            throw new Error(`Backup file error: ${backupResult.errors.join(', ')}`);
          }

          if (backupResult.warnings.length > 0) {
            console.warn('Backup warnings:', backupResult.warnings);
          }

          // Handle complete backup restore
          if (backupResult.data) {
            onRestoreCompleteBackup(backupResult.data);
            setImportStatus('success');

            // Enhanced success message with hierarchical folder info
            const hierarchicalInfo = backupResult.data.metadata?.hierarchicalStructure;
            let message = `Successfully restored complete backup with ${backupResult.data.bookmarks.length} bookmarks`;

            if (hierarchicalInfo && hierarchicalInfo.hasHierarchy) {
              message += `, ${hierarchicalInfo.totalFolders} folders (${hierarchicalInfo.nestedFolders} nested, max depth: ${hierarchicalInfo.maxDepth})`;
            } else {
              message += ` and ${backupResult.data.categories.length} categories`;
            }

            message += ', and all settings. 🌳 Hierarchical folder structure preserved!';
            setImportMessage(message);

            setTimeout(() => {
              handleClose();
            }, 2000);
            return;
          }
        } else {
            throw new Error("Unsupported file format. Please use JSON, CSV, HTML, or .bk backup files.");
        }


        const validBookmarks = importedData.map((b, index) => ({
          id: b.id || `imported-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          title: b.title || 'Untitled',
          url: b.url,
          description: b.description || '',
          category: b.category || 'Imported',
          tags: Array.isArray(b.tags) ? b.tags : (typeof b.tags === 'string' ? b.tags.split(',').map(t=>t.trim()).filter(Boolean) : []),
          isFavorite: !!b.isFavorite,
          dateAdded: b.dateAdded ? new Date(b.dateAdded) : new Date(),
          dateModified: new Date(),
          visits: Number(b.visits) || 0,
          favicon: b.favicon || defaultFaviconName
        })).filter(b => b.title && b.url && (b.url.startsWith('http://') || b.url.startsWith('https://')));
        
        if (validBookmarks.length > 0) {
          onImportBookmarks(validBookmarks);
          setImportStatus('success');
          setImportMessage(`Successfully imported ${validBookmarks.length} bookmarks.`);
          setTimeout(() => {
            handleClose();
          }, 2000);
        } else {
          setImportStatus('error');
          setImportMessage('No valid bookmarks found in the file.');
        }
      } catch (error: any) {
        console.error("Import error:", error);
        setImportStatus('error');
        setImportMessage(error.message || 'Failed to parse file. Please check the format.');
      }
    };

    reader.onerror = () => {
      setImportStatus('error');
      setImportMessage('Failed to read file.');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (files[0].name.endsWith('.json') || files[0].name.endsWith('.csv') || files[0].name.endsWith('.html') || files[0].name.endsWith('.htm') || files[0].name.endsWith('.bk')) {
        handleFileSelect(files[0]);
      } else {
        setImportStatus('error');
        setImportMessage('Unsupported file type. Please upload JSON, CSV, HTML, or .bk backup files.');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                {mode === 'import' ? <Upload className="w-5 h-5 text-white" /> : <Download className="w-5 h-5 text-white" />}
              </div>
              {mode === 'import' ? 'Import Bookmarks' : 'Export Bookmarks'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {mode === 'export' ? (
            <div className="space-y-6">
              <p className="text-gray-600">
                Export your {currentBookmarks.length} bookmarks in your preferred format:
              </p>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Complete Backup (.bk)</h3>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  Export everything: bookmarks, hierarchical folder structure, settings, and preferences in a single file. Perfect for OS reinstalls!
                </p>
                <div className="text-xs text-blue-600 mb-4">
                  <div className="font-medium mb-1">🌳 Includes hierarchical folder structure:</div>
                  <ul className="space-y-0.5 ml-4">
                    <li>• Nested folder organization</li>
                    <li>• Folder expansion states</li>
                    <li>• Complete folder hierarchy</li>
                    <li>• All bookmark categorization</li>
                  </ul>
                </div>
                <button
                  onClick={handleCompleteBackup}
                  className="w-full p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <Database className="w-5 h-5" />
                  Export Complete Backup (.bk)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleExport('json')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <FileText className="w-8 h-8 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-gray-900 mb-2">JSON</h3>
                  <p className="text-sm text-gray-600">Complete data with all metadata</p>
                </button>

                <button
                  onClick={() => handleExport('csv')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
                >
                  <FileText className="w-8 h-8 text-green-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-gray-900 mb-2">CSV</h3>
                  <p className="text-sm text-gray-600">Spreadsheet compatible format</p>
                </button>

                <button
                  onClick={() => handleExport('html')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
                >
                  <FileText className="w-8 h-8 text-purple-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-gray-900 mb-2">HTML</h3>
                  <p className="text-sm text-gray-600">Browser compatible format</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {(importStatus === 'idle' || importStatus === 'error') && (
                <>
                  {importStatus === 'error' && (
                     <div className="text-center py-4 bg-red-50 p-4 rounded-lg">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-red-700 font-medium">{importMessage}</p>
                        <button
                            onClick={resetModalState}
                            className="mt-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                  )}
                  <p className="text-gray-600">
                    Import bookmarks from JSON, CSV, HTML files, or restore complete backups from .bk files. 🌳 Hierarchical folder structures are fully preserved. Drag and drop a file or click to browse.
                  </p>
                  
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-gray-600 mb-4">
                      Supports JSON, CSV, HTML, and .bk backup formats
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.csv,.html,.htm,.bk"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                           if (file.name.endsWith('.json') || file.name.endsWith('.csv') || file.name.endsWith('.html') || file.name.endsWith('.htm') || file.name.endsWith('.bk')) {
                             handleFileSelect(file);
                           } else {
                             setImportStatus('error');
                             setImportMessage('Unsupported file type. Please upload JSON, CSV, HTML, or .bk backup files.');
                           }
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </>
              )}

              {importStatus === 'processing' && (
                <div className="text-center py-8">
                  <div role="status" className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" aria-label="Loading...">
                    <span className="sr-only">Processing...</span>
                  </div>
                  <p className="text-gray-600 mt-4">Processing your file...</p>
                </div>
              )}

              {importStatus === 'success' && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-green-600 font-medium">{importMessage}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

