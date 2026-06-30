import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "@sequelize/core";
import { Attribute, AutoIncrement, NotNull, PrimaryKey, Unique, Table } from "@sequelize/core/decorators-legacy";

@Table({ tableName: "radacct", timestamps: false })
export class RadAcct extends Model<InferAttributes<RadAcct>, InferCreationAttributes<RadAcct>> {
  @Attribute(DataTypes.BIGINT)
  @PrimaryKey
  @AutoIncrement
  declare radacctid: CreationOptional<number>;

  @Attribute(DataTypes.TEXT)
  @NotNull
  declare acctsessionid: string;

  @Attribute(DataTypes.TEXT)
  @NotNull
  @Unique
  declare acctuniqueid: string;

  @Attribute(DataTypes.TEXT)
  declare username: string | null;

  @Attribute(DataTypes.TEXT)
  declare realm: string | null;

  @Attribute(DataTypes.INET)
  @NotNull
  declare nasipaddress: string;

  @Attribute(DataTypes.TEXT)
  declare nasportid: string | null;

  @Attribute(DataTypes.TEXT)
  declare nasporttype: string | null;

  @Attribute(DataTypes.DATE)
  declare acctstarttime: Date | null;

  @Attribute(DataTypes.DATE)
  declare acctupdatetime: Date | null;

  @Attribute(DataTypes.DATE)
  declare acctstoptime: Date | null;

  @Attribute(DataTypes.BIGINT)
  declare acctinterval: number | null;

  @Attribute(DataTypes.BIGINT)
  declare acctsessiontime: number | null;

  @Attribute(DataTypes.TEXT)
  declare acctauthentic: string | null;

  @Attribute(DataTypes.TEXT)
  declare connectinfo_start: string | null;

  @Attribute(DataTypes.TEXT)
  declare connectinfo_stop: string | null;

  @Attribute(DataTypes.BIGINT)
  declare acctinputoctets: number | null;

  @Attribute(DataTypes.BIGINT)
  declare acctoutputoctets: number | null;

  @Attribute(DataTypes.TEXT)
  declare calledstationid: string | null;

  @Attribute(DataTypes.TEXT)
  declare callingstationid: string | null;

  @Attribute(DataTypes.TEXT)
  declare acctterminatecause: string | null;

  @Attribute(DataTypes.TEXT)
  declare servicetype: string | null;

  @Attribute(DataTypes.TEXT)
  declare framedprotocol: string | null;

  @Attribute(DataTypes.INET)
  declare framedipaddress: string | null;

  @Attribute(DataTypes.INET)
  declare framedipv6address: string | null;

  @Attribute(DataTypes.INET)
  declare framedipv6prefix: string | null;

  @Attribute(DataTypes.TEXT)
  declare framedinterfaceid: string | null;

  @Attribute(DataTypes.INET)
  declare delegatedipv6prefix: string | null;

  @Attribute(DataTypes.TEXT)
  declare class: string | null;
}
