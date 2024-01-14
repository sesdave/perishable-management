import { Sequelize } from 'sequelize';
import LotModel from './Lot';
import fs from 'fs'
import path from 'path';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST || 'pg-2480f26e-developerdavids-8cc4.aivencloud.com',
  port: Number(process.env.POSTGRES_PORT) || 24745,
  username: process.env.POSTGRES_USER || 'avnadmin',
  password: process.env.POSTGRES_PASSWORD || 'AVNS_VEJqirdL2fMNLEmCVqt', 
  database: process.env.POSTGRES_NAME || 'defaultdb', 
  ssl: true,
  dialectOptions: {
    ssl: {
      require: true, 
      ca: fs.readFileSync(path.resolve(__dirname, '../../certs/ca.pem')),
    },
  },
});

// Define models
const Lot = LotModel(sequelize);

export { sequelize, Lot }; // Export User along with other models
