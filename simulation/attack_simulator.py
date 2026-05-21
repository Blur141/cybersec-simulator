#!/usr/bin/env python3
"""
Cybersecurity Attack Simulator - Python Simulation Engine
Provides realistic network attack pattern generation and system metrics.
NOTE: This is for EDUCATIONAL and DEMONSTRATION purposes only.
All simulations are synthetic and target no real systems.
"""

import json
import time
import random
import threading
import ipaddress
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ─── Synthetic Attack Pattern Generators ─────────────────────────────────────

class AttackPatternGenerator:
    """Generates realistic-looking (but synthetic) attack telemetry for visualization."""

    def __init__(self):
        self.attacker_ips = [
            '185.220.101.47', '45.33.32.156', '198.51.100.10', '203.0.113.0',
            '192.0.2.1', '198.18.0.1', '192.88.99.0', '100.64.0.1'
        ]
        self.target_subnets = ['192.168.1.0/24', '192.168.2.0/24', '10.0.0.0/8']

    def generate_ddos_traffic(self, target_ip: str, intensity: str = 'high') -> dict:
        multipliers = {'low': 1000, 'medium': 5000, 'high': 25000, 'critical': 100000}
        pps = multipliers.get(intensity, 5000) + random.randint(-1000, 1000)
        sources = random.randint(50, 500)
        protocols = ['UDP', 'TCP-SYN', 'ICMP', 'HTTP-GET', 'DNS-AMPLIFY']
        return {
            'type': 'ddos',
            'target': target_ip,
            'packets_per_sec': pps,
            'bandwidth_gbps': round(pps * 1500 / 1e9, 3),
            'source_count': sources,
            'protocol': random.choice(protocols),
            'spoofed_ips': [f'{random.randint(1,254)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}' for _ in range(min(sources, 20))],
            'timestamp': datetime.now().isoformat(),
            'severity': 'CRITICAL' if pps > 50000 else 'HIGH'
        }

    def generate_bruteforce_attempt(self, target_ip: str, service: str = 'SSH') -> dict:
        usernames = ['root', 'admin', 'ubuntu', 'user', 'test', 'guest', 'operator', 'sysadmin']
        passwords = ['password', '123456', 'admin', 'root', 'letmein', 'qwerty', 'monkey', 'master']
        return {
            'type': 'bruteforce',
            'target': target_ip,
            'service': service,
            'port': 22 if service == 'SSH' else 3389,
            'source_ip': random.choice(self.attacker_ips),
            'username_tried': random.choice(usernames),
            'password_tried': '*' * random.randint(6, 12),
            'attempt_number': random.randint(1, 50000),
            'success': False,
            'timestamp': datetime.now().isoformat(),
            'user_agent': 'Hydra/9.4 (Linux)',
            'delay_ms': random.randint(0, 100)
        }

    def generate_port_scan(self, target_ip: str) -> dict:
        common_ports = [21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995, 1723, 3306, 3389, 5900, 8080]
        scan_results = {}
        for port in random.sample(common_ports, random.randint(5, len(common_ports))):
            state = 'open' if random.random() < 0.25 else 'closed' if random.random() < 0.7 else 'filtered'
            service = {22: 'ssh', 80: 'http', 443: 'https', 3306: 'mysql', 3389: 'rdp', 8080: 'http-alt'}.get(port, 'unknown')
            scan_results[port] = {'state': state, 'service': service}
        return {
            'type': 'portscan',
            'target': target_ip,
            'source_ip': random.choice(self.attacker_ips),
            'scan_type': random.choice(['-sS', '-sT', '-sU', '-sA']),
            'ports_scanned': len(scan_results),
            'open_ports': [p for p, r in scan_results.items() if r['state'] == 'open'],
            'results': scan_results,
            'os_guess': random.choice(['Linux 5.x', 'Ubuntu 20.04', 'Windows Server 2019', 'FreeBSD']),
            'timestamp': datetime.now().isoformat(),
            'duration_ms': random.randint(500, 5000)
        }

    def generate_mitm_intercept(self, victim_ip: str, gateway_ip: str) -> dict:
        protocols = ['HTTP', 'FTP', 'TELNET', 'SMTP']
        return {
            'type': 'mitm',
            'victim_ip': victim_ip,
            'gateway_ip': gateway_ip,
            'attacker_ip': random.choice(self.attacker_ips),
            'technique': 'ARP-Poisoning',
            'intercepted_protocol': random.choice(protocols),
            'packets_intercepted': random.randint(100, 10000),
            'credentials_harvested': random.random() < 0.3,
            'arp_table': {
                gateway_ip: {'mac': 'de:ad:be:ef:00:01', 'spoofed': True},
                victim_ip: {'mac': 'ca:fe:ba:be:00:02', 'spoofed': False}
            },
            'timestamp': datetime.now().isoformat()
        }

    def generate_malware_beacon(self, infected_ip: str, c2_ip: str) -> dict:
        return {
            'type': 'malware_c2',
            'infected_host': infected_ip,
            'c2_server': c2_ip,
            'protocol': random.choice(['HTTPS', 'DNS', 'HTTP']),
            'beacon_interval_sec': random.choice([60, 120, 300, 600]),
            'data_exfil_bytes': random.randint(0, 5000000),
            'persistence_mechanism': random.choice(['Registry Run Key', 'Scheduled Task', 'Service', 'Startup Folder']),
            'process_injected': random.choice(['svchost.exe', 'explorer.exe', 'notepad.exe', 'cmd.exe']),
            'ioc_hash': ''.join(random.choices('0123456789abcdef', k=64)),
            'timestamp': datetime.now().isoformat()
        }

    def generate_packet_analysis(self, count: int = 10) -> list:
        protocols = ['TCP', 'UDP', 'ICMP', 'DNS', 'HTTP', 'HTTPS', 'ARP', 'SSH']
        packets = []
        for _ in range(count):
            src = f'192.168.{random.randint(1,3)}.{random.randint(1,254)}'
            dst = f'192.168.{random.randint(1,3)}.{random.randint(1,254)}'
            proto = random.choice(protocols)
            packets.append({
                'timestamp': time.time(),
                'src_ip': src,
                'dst_ip': dst,
                'protocol': proto,
                'src_port': random.randint(1024, 65535),
                'dst_port': random.choice([22, 80, 443, 53, 3306, 8080]),
                'length': random.randint(40, 1500),
                'flags': random.choice(['SYN', 'ACK', 'SYN-ACK', 'FIN', 'RST', 'PSH-ACK']) if proto == 'TCP' else None,
                'info': f'{proto} packet'
            })
        return packets


# ─── Flask Routes ─────────────────────────────────────────────────────────────

generator = AttackPatternGenerator()

@app.route('/health')
def health():
    return jsonify({'status': 'operational', 'service': 'attack-simulator', 'version': '2.4.7'})

@app.route('/simulate/ddos', methods=['POST'])
def simulate_ddos():
    data = request.json or {}
    target = data.get('target', '192.168.1.10')
    intensity = data.get('intensity', 'high')
    result = generator.generate_ddos_traffic(target, intensity)
    return jsonify(result)

@app.route('/simulate/bruteforce', methods=['POST'])
def simulate_bruteforce():
    data = request.json or {}
    target = data.get('target', '192.168.1.10')
    service = data.get('service', 'SSH')
    attempts = []
    for _ in range(data.get('count', 10)):
        attempts.append(generator.generate_bruteforce_attempt(target, service))
    return jsonify({'attempts': attempts, 'total': len(attempts), 'success': False})

@app.route('/simulate/portscan', methods=['POST'])
def simulate_portscan():
    data = request.json or {}
    target = data.get('target', '192.168.1.10')
    return jsonify(generator.generate_port_scan(target))

@app.route('/simulate/mitm', methods=['POST'])
def simulate_mitm():
    data = request.json or {}
    victim = data.get('victim', '192.168.1.100')
    gateway = data.get('gateway', '192.168.1.1')
    return jsonify(generator.generate_mitm_intercept(victim, gateway))

@app.route('/simulate/malware', methods=['POST'])
def simulate_malware():
    data = request.json or {}
    infected = data.get('infected', '192.168.1.105')
    c2 = data.get('c2', '198.51.100.10')
    return jsonify(generator.generate_malware_beacon(infected, c2))

@app.route('/simulate/packets', methods=['GET'])
def simulate_packets():
    count = int(request.args.get('count', 20))
    return jsonify({'packets': generator.generate_packet_analysis(count), 'count': count})

@app.route('/simulate/full-attack', methods=['POST'])
def simulate_full_attack():
    """Generate a complete multi-stage attack scenario."""
    data = request.json or {}
    attack_type = data.get('type', 'ddos')
    target = data.get('target', '192.168.1.10')
    results = {'type': attack_type, 'target': target, 'stages': [], 'timestamp': datetime.now().isoformat()}

    if attack_type == 'ddos':
        results['stages'] = [
            {'stage': 1, 'name': 'Reconnaissance', 'data': generator.generate_port_scan(target)},
            {'stage': 2, 'name': 'Initial Flood', 'data': generator.generate_ddos_traffic(target, 'medium')},
            {'stage': 3, 'name': 'Peak Attack', 'data': generator.generate_ddos_traffic(target, 'critical')},
        ]
    elif attack_type == 'apt':
        results['stages'] = [
            {'stage': 1, 'name': 'Initial Access', 'data': generator.generate_bruteforce_attempt(target)},
            {'stage': 2, 'name': 'Lateral Movement', 'data': generator.generate_mitm_intercept(target, '192.168.1.1')},
            {'stage': 3, 'name': 'C2 Beacon', 'data': generator.generate_malware_beacon(target, '198.51.100.10')},
            {'stage': 4, 'name': 'Exfiltration', 'data': generator.generate_packet_analysis(50)},
        ]

    return jsonify(results)


if __name__ == '__main__':
    print('\n╔══════════════════════════════════════════╗')
    print('║  ATTACK SIMULATOR - PYTHON ENGINE         ║')
    print('║  Port: 5000  |  Mode: EDUCATIONAL DEMO    ║')
    print('╚══════════════════════════════════════════╝\n')
    app.run(host='0.0.0.0', port=5000, debug=False)
