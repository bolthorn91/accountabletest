import { User } from '../../domain/models/User';
import { Book } from '../../domain/models/Book';

// In a real application, this would connect to an email service
// Implementation would use a real email service like SendGrid, Mailgun, etc.
export class EmailService {
  async sendDueReminder(user: User, book: Book, dueDate: Date): Promise<void> {
    console.log(`Sending due date reminder to ${user.email} for book "${book.title}"`);
    console.log(`Due date: ${dueDate.toLocaleDateString()}`);
    
  }

  async sendLateReminder(user: User, book: Book, dueDate: Date, lateFee: number): Promise<void> {
    console.log(`SENDING LATE REMINDER EMAIL to ${user.email}:`);
    console.log(`Dear ${user.name},`);
    console.log(`The book "${book.title}" was due on ${dueDate.toLocaleDateString()}.`);
    console.log(`You have incurred a late fee of €${lateFee.toFixed(2)}.`);
    console.log(`Please return the book as soon as possible to avoid additional fees.`);
    console.log(`If the late fee reaches €${book.retailPrice.toFixed(2)} (the retail price of the book), you will automatically purchase the book.`);
    console.log(`Thank you, The Library Team`);
  }

  async sendBookPurchaseNotification(user: User, book: Book, price: number): Promise<void> {
    console.log(`SENDING BOOK PURCHASE NOTIFICATION to ${user.email}:`);
    console.log(`Dear ${user.name},`);
    console.log(`The late fees for "${book.title}" have reached the retail price of €${price.toFixed(2)}.`);
    console.log(`You are now considered to have purchased this book. The amount has been deducted from your wallet.`);
    console.log(`Your current wallet balance is €${user.walletBalance.toFixed(2)}.`);
    console.log(`Thank you for your purchase, The Library Team`);
  }
} 