import { Nas } from "./nas.model";
import { RadAcct } from "./radacct.model";
import { RadCheck } from "./radcheck.model";
import { RadReply } from "./radreply.model";
import { RadGroupCheck } from "./radgroupcheck.model";
import { RadGroupReply } from "./radgroupreply.model";
import { RadUserGroup } from "./radusergroup.model";
import { RadPostAuth } from "./radpostauth.model";

import { RapidNas } from "./rapid-nas.model";

export const radiusModels = [Nas, RadAcct, RadCheck, RadReply, RadGroupCheck, RadGroupReply, RadUserGroup, RadPostAuth];

export const rapidRadiusModels = [RapidNas];
