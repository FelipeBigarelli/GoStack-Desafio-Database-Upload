import { getRepository, getCustomRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome',
  value: number;
   category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const contactsReadStream = fs.createReadStream(filePath);

    const parses = csvParse({
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parses); // conforme tem linhas disponíveis, pipe vai ler

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];
    
    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if ( !title || !type || !value ) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCaterogies = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCaterogiesTitles = existentCaterogies.map(
      (category: Category) => category.title,
    );
    
    // Filtrar os iguais
    const addCategoryTitles = categories
    .filter(category => !existentCaterogiesTitles.includes(category))
    .filter((value, index, self) => self.indexOf(value) == index);

    const newCategories = categoryRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const finalCategories = [ ...newCategories, ...existentCaterogies];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value, 
        category: finalCategories.find(
          category => category.title == transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filePath); // exclue arquivo depois de rodar

    return createdTransactions;
  }
}

export default ImportTransactionsService;
