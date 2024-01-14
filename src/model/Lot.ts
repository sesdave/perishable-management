import { DataTypes, Sequelize, Model } from 'sequelize';

export default (sequelize: Sequelize) => {
  class Lot extends Model {
    id!: number;
    item!: string;
    quantity!: number;
    expiry!: Date;
  }

  Lot.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      item: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      expiry: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'lots',
      timestamps: false,
    }
  );

  return Lot;
};
