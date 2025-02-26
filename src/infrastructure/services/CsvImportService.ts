import fs from 'fs';
import { parse } from 'csv-parse';
import { Book } from '../../domain/models/Book';
import { BookService } from '../../application/services/BookService';

export class CsvImportService {
  constructor(private bookService: BookService) {}

  async importBooksFromCsv(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const books: Book[] = [];
      
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', (row) => {
          const book: Omit<Book, '_id'> = {
            isbn: row.id,
            title: row.title,
            author: row.author,
            publicationYear: parseInt(row.publication_year, 10),
            publisher: row.publisher,
            retailPrice: parseFloat(row.price),
            totalCopies: 4, // Default to 4 copies per reference
            availableCopies: 4
          };
          
          books.push(book);
        })
        .on('error', (error) => {
          reject(error);
        })
        .on('end', async () => {
          let importedCount = 0;
          
          for (const book of books) {
            try {
              await this.bookService.createBook(book);
              importedCount++;
            } catch (error) {
              console.error(`Error importing book ${book.title}:`, error);
            }
          }
          
          resolve(importedCount);
        });
    });
  }
} 