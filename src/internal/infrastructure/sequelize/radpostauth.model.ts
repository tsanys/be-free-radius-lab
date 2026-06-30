import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "@sequelize/core";
import { Attribute, AutoIncrement, NotNull, PrimaryKey, Table, Default } from "@sequelize/core/decorators-legacy";

@Table({ tableName: "radpostauth", timestamps: false })
export class RadPostAuth extends Model<InferAttributes<RadPostAuth>, InferCreationAttributes<RadPostAuth>> {
  @Attribute(DataTypes.BIGINT)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.TEXT)
  @NotNull
  declare username: string;

  @Attribute(DataTypes.TEXT)
  declare pass: string | null;

  @Attribute(DataTypes.TEXT)
  declare reply: string | null;

  @Attribute(DataTypes.TEXT)
  declare calledstationid: string | null;

  @Attribute(DataTypes.TEXT)
  declare callingstationid: string | null;

  @Attribute(DataTypes.DATE)
  @NotNull
  @Default(DataTypes.NOW)
  declare authdate: CreationOptional<Date>;

  @Attribute(DataTypes.TEXT)
  declare class: string | null;
}
