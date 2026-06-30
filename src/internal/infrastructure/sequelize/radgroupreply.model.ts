import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "@sequelize/core";
import { Attribute, AutoIncrement, NotNull, PrimaryKey, Table } from "@sequelize/core/decorators-legacy";

@Table({ tableName: "radgroupreply", timestamps: false })
export class RadGroupReply extends Model<InferAttributes<RadGroupReply>, InferCreationAttributes<RadGroupReply>> {
  @Attribute(DataTypes.BIGINT)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare groupname: string;

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
