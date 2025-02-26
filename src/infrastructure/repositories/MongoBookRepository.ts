import { Collection, Db, ObjectId } from 'mongodb';
import { Book } from '../../domain/models/Book';
import { BookRepository, BookSearchQuery } from '../../domain/repositories/BookRepository';

export class MongoBookRepository implements BookRepository {
  private collection: Collection<Book>;

  constructor(db: Db) {
    this.collection = db.collection<Book>('books');
  }

  async findById(id: ObjectId): Promise<Book | null> {
    return this.collection.findOne({ _id: id });
  }

  async findByIsbn(isbn: string): Promise<Book | null> {
    return this.collection.findOne({ isbn });
  }

  async findAll(page: number = 1, limit: number = 10): Promise<Book[]> {
    return this.collection
      .find()
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
  }

  async search(query: BookSearchQuery, page: number = 1, limit: number = 10): Promise<Book[]> {
    const filter: any = {};
    
    if (query.title) {
      filter.title = { $regex: query.title, $options: 'i' };
    }
    
    if (query.author) {
      filter.author = { $regex: query.author, $options: 'i' };
    }
    
    if (query.year) {
      filter.publicationYear = query.year;
    }
    
    return this.collection
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
  }

  async create(book: Book): Promise<Book> {
    const result = await this.collection.insertOne(book);
    return { ...book, _id: result.insertedId };
  }

  async update(id: ObjectId, book: Partial<Book>): Promise<Book | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: book },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  async delete(id: ObjectId): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async count(): Promise<number> {
    return this.collection.countDocuments();
  }
} 