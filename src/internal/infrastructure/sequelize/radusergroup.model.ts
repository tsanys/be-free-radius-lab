import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "@sequelize/core";
import { Attribute, AutoIncrement, NotNull, PrimaryKey, Table } from "@sequelize/core/decorators-legacy";

@Table({ tableName: "radusergroup", timestamps: false })
export class RadUserGroup extends Model<InferAttributes<RadUserGroup>, InferCreationAttributes<RadUserGroup>> {
  @Attribute(DataTypes.BIGINT)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare username: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare groupname: string;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare priority: number;
}
