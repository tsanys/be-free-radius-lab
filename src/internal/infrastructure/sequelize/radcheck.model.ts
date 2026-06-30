import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "@sequelize/core";
import { Attribute, AutoIncrement, NotNull, PrimaryKey, Table } from "@sequelize/core/decorators-legacy";

@Table({ tableName: "radcheck", timestamps: false })
export class RadCheck extends Model<InferAttributes<RadCheck>, InferCreationAttributes<RadCheck>> {
  @Attribute(DataTypes.BIGINT)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare username: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare attribute: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare op: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare value: string;
}
