import { NodeSSH, Config, SSHExecCommandResponse } from "node-ssh";

export class MikroTik {
  private ssh: NodeSSH;
  private config: Config;

  constructor(config: Config) {
    this.ssh = new NodeSSH();
    this.config = config;
  }

  connect(): Promise<NodeSSH> {
    return this.ssh.connect(this.config);
  }

  add(service: string, src_address: string, address: string, secret: string): Promise<SSHExecCommandResponse> {
    return this.ssh.execCommand(
      `/radius add service=${service} src-address=${src_address} address=${address} secret=${secret}`,
    );
  }

  set(id: number, values: Record<string, string>): Promise<SSHExecCommandResponse> {
    const updates = Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join(" ");
    return this.ssh.execCommand(`/radius set [find .id=${id}] ${updates}`);
  }

  remove(id: number): Promise<SSHExecCommandResponse> {
    return this.ssh.execCommand(`/radius remove [find .id=${id}]`);
  }
}
