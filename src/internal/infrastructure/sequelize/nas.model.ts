import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "@sequelize/core";
import { Attribute, AutoIncrement, NotNull, PrimaryKey, Table } from "@sequelize/core/decorators-legacy";

@Table({ tableName: "nas", timestamps: false })
export class Nas extends Model<InferAttributes<Nas>, InferCreationAttributes<Nas>> {
  @Attribute(DataTypes.BIGINT)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare nasname: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare shortname: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare type: string;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare ports: number;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare secret: string;

  @Attribute(DataTypes.STRING)
  declare server: CreationOptional<string | null>;

  @Attribute(DataTypes.STRING)
  declare community: CreationOptional<string | null>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare description: string;
}
