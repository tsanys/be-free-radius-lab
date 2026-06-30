import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "@sequelize/core";
import { Attribute, AutoIncrement, NotNull, PrimaryKey, Table } from "@sequelize/core/decorators-legacy";

@Table({ tableName: "nas", timestamps: false })
export class RapidNas extends Model<InferAttributes<RapidNas>, InferCreationAttributes<RapidNas>> {
  @Attribute(DataTypes.BIGINT)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare nasname: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare username: string;

  @Attribute(DataTypes.TEXT)
  @NotNull
  declare password: string;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare port_authentication: number;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare port_accounting: number;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare port_api: number;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare port_ssh: number;
}
