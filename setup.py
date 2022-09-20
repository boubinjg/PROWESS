import subprocess
import argparse
import os
import time
import mysql.connector

def startup():
    print('############################################################')
    print('# Pomerene IoT Lab Scheduler Setup Script                  #')
    print('#                                                          #')
    print('# This Script Does the following:                          #')
    print('# 1) initializes Kubernetes on a list of remote machines   #')
    print('# 2) Starts Scheduling Webapp                              #')
    print('# 3) Shut Down System                                      #')
    print('#                                                          #')
    print('# Before you begin, make sure the following are all true:  #')
    print('# 1) All nodes have Kubernetes installed                   #')
    print('# 2) Helm is installed on the master                       #')
    print('# 3) Your current user has access to Kubernetes and helm   #')
    print('# 4) You have specified all remote machines in the         #')
    print('#    remote.cfg file in this directory                     #')
    print('# 6) All hosts have an account named \'kube\'              #')
    print('# 5) Your current user has passwordless login access to    #')
    print('#    all machines listed in remote.cfg via a kube account  #')
    print('# 7) All kube accounts have passwordless sudo access       #')
    print('############################################################')
    print('############################################################')
    print('# Arguments:                                               #')
    print('# -kube:     Configure kubernetes cluster                  #')
    print('# -install:  install necessary helm charts                 #')
    print('# -webapp:   starts the scheduling webapp                  #')
    print('# -all:      -hdfs + -install                              #')
    print('# -shutdown: shuts down the cluster and webapp             #')
    print('# -user:     Kubernetes master user (Required for -kube    #')
    print('# -d:        print debug information                       #')
    print('############################################################')
    print('############################################################')
    print('# If all conditions are satisfied, press y to continue     #')
    print('# else, press any other key to abort                       #')
    print('############################################################')

def debugPrint(out, err):
    print('Output: ')
    print(out)
    print('Error: ')

def readInCFG():
    f = open('remote.cfg')
    lines = f.readlines()
    remoteHosts = []
    for l in lines:
        l = l.rstrip()
        remoteHosts.append(l)
    return remoteHosts
    
def execute(command, args):
	process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	stdout, stderr = process.communicate()
	stdout = stdout.decode('utf-8')
	stderr = stderr.decode('utf-8')
	if(args.debug):
		debugPrint(stdout, stderr)
	return stdout

def executeShell(command, args):
	process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	stdout, stderr = process.communicate()
	stdout = stdout.decode('utf-8')
	stderr = stderr.decode('utf-8')

	if(args.debug):
		debugPrint(stdout, stderr)
	return stdout

def startKube(remoteHosts, args):
    
    print('Disabling Swap on All Hosts')
    execute(['sudo', 'swapoff','-a'], args)
	
    if(remoteHosts != ['']):
        for host in remoteHosts:
            execute(['ssh','kube@'+host,'-S','sudo', 'swapoff','-a'], args)

    print('Resetting Kubeadm on All Hosts')
    executeShell('echo Y|sudo kubeadm reset', args)
    
    if(remoteHosts != ['']):
        for host in remoteHosts:
            process = execute(['echo Y| ssh kube@'+host+' sudo kubeadm reset'], args)

    print('Initializing Kubernetes on Master')
    stdout = execute(['sudo','kubeadm','init','--pod-network-cidr=10.244.0.0/16'], args)
    
    join = stdout.splitlines()[-2]+stdout.splitlines()[-1]

    print('Resetting Master Config File')
    executeShell('echo y| sudo cp -i /etc/kubernetes/admin.conf /home/'+args.user+'/.kube/config', args)

    print('Adding Remote Hosts to Kubernetes Cluster')
    if(remoteHosts != ['']):
        for host in remoteHosts:
            execute('ssh kube@'+host+' sudo '+join, args)

    print('Untainting Master Node')
    executeShell('kubectl taint nodes --all node-role.kubernetes.io/master-' , args)

    print('Adding Flannel Network CNI')
    executeShell('kubectl apply -f https://github.com/coreos/flannel/raw/master/Documentation/kube-flannel.yml', args)
    
    print('Adding Kubernetes Dashboard')

    executeShell('kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.1.0/aio/deploy/recommended.yaml', args)

    print('Installing Loadbalancer')

    executeShell('helm install stable/metallb -f values/metallb-config.yaml --generate-name', args)

    print('Installing Ingress Controller')

    executeShell('helm install stable/traefik --set dashboard.enabled=true,serviceType=LoadBalancer,rbac.enabled=false,dashboard.domain=dashboard.localhost --generate-name', args)

    time.sleep(10)

    print('Installing Cockpit')
    executeShell('mkdir /home/'+args.user+'/IoTLabScheduler/cockpit/', args)

    executeShell('mkdir /home/'+args.user+'/IoTLabScheduler/cockpit/storage', args)
   
    executeShell('kubectl apply -f values/cockpit_new.yaml', args)

    print('    Waiting for Cockpit pod IP Assignment')
    time.sleep(10)

    #print('Initializing Cockpit')
    #out = executeShell('kubectl get pods -o wide', args)
    #out = out.split('\n')
    #cockpitIP = out[1].split()[5]

    #executeShell('curl http://'+cockpitIP+':80/install', args)
    print('The Kubernetes Cluster has been conigured')
    print('Type \'kubectl get nodes\' when logged in as '+args.user)
    print('to assure all nodes are connected')

    
    print('Installing Grafana')
    executeShell('mkdir /home/'+args.user+'/IoTLabScheduler/grafana', args)

    executeShell('sudo chmod -R 777 /home/'+args.user+'IoTLabScheduler/grafana', args)

    executeShell('kubectl apply -f values/grafana_new.yaml', args)

    print('Installing NFS Provisioner')
    
    executeShell('sudo systemctl start nfs-server', args)

    executeShell('sudo mkdir -p /mnt/nfs_share', args)
    executeShell('sudo mkdir -p /mnt/nfs_share/kubedata', args)
    executeShell('sudo mount -t nfs 127.0.0.1:/ /mnt/nfs_share/kubedata', args)
    executeShell('helm install stable/nfs-client-provisioner --set nfs.server=127.0.0.1 --set nfs.path=/ --generate-name', args)
    
    print('Installing Elasticsearch')
    executeShell('helm install elasticsearch elastic/elasticsearch -f values/elasticsearch.values.yml', args)
    print('Checking Elasticsearch Health')
    time.sleep(3)
    out = executeShell('kubectl get pods -o wide', args)
    out = out.split('\n')
    esIP = out[2].split()[5]
    healthy = False
    for i in range(10):
        time.sleep(20)
        try:
            out = executeShell('curl http://'+esIP+':9200/_cluster/health', args)
            parsed = out.split(',')
            if(parsed[1] == '\"status\":\"green\"' or parsed[1] == '\"status\":\"yellow\"' ):
                healthy = True
                break;
            else:
                print('Cluster Currently Unhealthy')
        except:
            print('Health Check Error')
            pass
    if(healthy):
        executeShell('curl -X PUT -H "Content-Type: application/json" -d @conf/elasticsearch_node_status_schema.json '+esIP+':9200/status', args)
    
    print('Installing Ingestion Server')
    executeShell('kubectl apply -f values/ingestion.yaml', args)

def startWebapp(args):
    executeShell('sudo docker rm -f webappdb webbackend webapp', args)
    time.sleep(1)
    executeShell('cd scheduler-react',args)
    executeShell('bash runfrontend.sh', args)
    executeShell('cd ..', args)
    time.sleep(1)
    executeShell('bash scheduler-react/runsql.sh', args)
    time.sleep(30)

    cnx = mysql.connector.connect(user='root', 
                                  password='my-secret-pw',  
                                  host='192.168.0.2',
                                  port='3306', 
                                  use_pure=False)
    cursor = cnx.cursor()

	
    cmd = 'CREATE DATABASE calendar;'
    cursor.execute(cmd)    

    cmd = 'ALTER USER \'root\' IDENTIFIED WITH mysql_native_password BY \'my-secret-pw\';'
    cursor.execute(cmd)    

    cmd = 'CREATE TABLE calendar.calendar_entries (id INT AUTO_INCREMENT PRIMARY KEY, user varchar(255), container varchar(1024), container varchar(65535), volume varchar(1024), start_date DATETIME, end_date DATETIME, start_time TIME, end_time TIME, description TEXT(1024), all_sensors BOOL, all_mics BOOL, mic1 BOOL, mic2 BOOL, mic3 BOOL, all_cams BOOL, cam1 BOOL, cam2 BOOL, cam3 BOOL, gpu BOOL, sdr BOOL, status TEXT);'
    cursor.execute(cmd)    

    executeShell('bash scheduler-react/runbackend.sh', args)

def reset(args, remoteHosts):
    print('Resetting Kubeadm on All Hosts')
    executeShell('echo Y|sudo kubeadm reset', args)
    
    if(remoteHosts != ['']):
        for host in remoteHosts:
            process = execute(['echo Y| ssh kube@'+host+' sudo kubeadm reset'], args)

def install(args):
    executeShell('helm repo add stable https://charts.helm.sh/stable', args)
    executeShell('helm repo add elastic https://helm.elastic.co',args)

def main(args):
    startup()
    val = input('Continue? (y/n): ')
    if(val[0] != 'y'):
        print('Exiting')
    else:
        print('Beginning Installation')
        remoteHosts = readInCFG()
            
        if(not (args.kube or args.shutdown or args.install or args.webapp or args.all)):
            print('No Configuration Options Specified')
            print('Exiting')
            exit()
        if(args.shutdown):
            reset(args, remoteHosts)
        if(args.install or args.all):
            install(args)
        if(args.kube or args.all):
            if(args.user == None):
                print('No User Specified')
                print('Exiting')
            else:
            	startKube(remoteHosts, args)
        if(args.webapp or args.all):
            print('Starting Webapp')
            startWebapp(args)

    print('############################################################')
    print('# Configuration Complete                                   #')
    print('############################################################')

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('-debug', action="store_true", help='Print Debug Information')
    parser.add_argument('-user',type=str, help='Username for Kubernetes master account')
    parser.add_argument('-kube',action="store_true", help='Flag to configure kubernetes')
    parser.add_argument('-shutdown',action="store_true", help='Resets Kubernetes')
    parser.add_argument('-install',action="store_true", help='Flag to install necessary helm charts')
    parser.add_argument('-webapp',action="store_true", help='Flag to configure Scheduling Webapp')
    parser.add_argument('-all', action="store_true", help='Flag to configure everything')
    args = parser.parse_args()
    main(args)
