# be-free-radius-system

## radgroupreply
- Framed-IP-Address
- Framed-IP-Netmask
- Framed-Route
- Session-Timeout
- Idle-Timeout
- Max-Daily-Session
- Framed-Protocol
- Service-Type
- Class
- Login-IP-Host
- Login-Service
- Reply-Message
- Tunnel-Type
- Tunnel-Medium-Type
- Tunnel-Client-Address
- NAS-Port-Type
- NAS-Port


## radreply
- Framed-IP-Netmask
- Framed-Route
- NAS-IP-Address
- Framed-Protocol
- Calling-Station-Id
- Service-Type
- Framed-Compression
- Mikrotik-Local-Address
- Mikrotik-Remote-Address


## Insert MikroTik router as a client with PPP service type
INSERT INTO public.nas (nasname, shortname, type, secret, ports, server, community, description)
VALUES ('192.168.88.1', 'mikrotik-ppp', 'ppp', 'shared_secret', 0, '192.168.88.1', NULL, 'MikroTik Router for PPP');


- create radcheck or radgroupcheck need sync to mikrotik or not

ip server : 103.158.253.249
ip client : vpn.rapid.net.id:8292

user : san
pass : san1!


- check snmp support command
snmpwalk -v2c -c r4p1d 10.158.252.1 1.3.6.1.4.1.14988
