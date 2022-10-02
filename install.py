import subprocess
import argparse
import os
import time
import mysql.connector
import shutil
import json
import traceback
import os
import docker

def startup():
    print('############################################################')
    print('# PROWESS Experiment Scheduler Install Script              #')
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

def install(args):
    executeShell('helm repo add stable https://charts.helm.sh/stable', args)
    executeShell('helm repo add elastic https://helm.elastic.co',args)

def config(args):
	print('\n')
	print('############################################################')
	print('Configuring')
	print('############################################################')
	print('\n')

	data = None
	try:
		f = open('config.json')
		data = json.load(f)
	except:
		print("Error Reading config.json, does it exist?")
		print("Exiting Installer")
		traceback.print_exc()
		exit()

	shutil.copyfile('config.json','Frontend/src/config.json')
	shutil.copyfile('config.json','Backend/nodejs-server/server/config.json')
	shutil.copyfile('config.json','Governor/config.json')

	shutil.copyfile(data['sslcert'],'Backend/nodejs-server/server/cert.cer')
	shutil.copyfile(data['publickey'],'Backend/nodejs-server/server/client-key.pem')
	
	print('\n')
	print('############################################################')
	print('Configuration Complete')
	print('############################################################')
	print('\n')

	return;

def frontend(args):
	print('\n')
	print('############################################################')
	print('Installing Frontend')
	print('############################################################')
	print('\n')

	data = None
	try:
		f = open('config.json')
		data = json.load(f)
	except:
		print("Error Reading config.json, does it exist?")
		print("Exiting Installer")
		traceback.print_exc()
		exit()


	dir = data['webpath']

	os.chdir('Frontend/')

	subprocess.check_call('npm install', shell=True)
	subprocess.check_call('npm run build', shell=True)
	
	shutil.rmtree(dir)
	shutil.copytree('build/',dir)
	
	if(args.shib):
		shutil.copyfile('../secret/htaccess',dir+'/.htaccess')

	os.chdir('../')

	try:
		subprocess.check_call('systemctl restart httpd', shell=True)
	except:
		print('Failed to restart httpd. Please restart your apache service')
	if(args.shib):
		try:	
			subproess.check_call('systemctl restart shibd')
		except:
			print('Failed to restart shibd. Please restart your shibboleth service')

	print('\n')
	print('############################################################')
	print('Frontend Installation Complete')
	print('############################################################')
	print('\n')

	return;

def backend(args):
	print('\n')
	print('############################################################')
	print('Installing Backend')
	print('############################################################')
	print('\n')
	
	data = None
	try:
		f = open('config.json')
		data = json.load(f)
	except:
		print("Error Reading config.json, does it exist?")
		print("Exiting Installer")
		traceback.print_exc()
		exit()



	dir = data['webpath']+'/php/'
	if os.path.exists(dir):
    		shutil.rmtree(dir)	
	shutil.copytree('./Backend/php/',dir)
	
	
	'''
	client = docker.from_env()

	#Build Database Container

	os.chdir('Database/Docker')

	ret = client.images.build(path=".", tag="prowess-db")
	print(ret)

	#Build Backend Container
	
	os.chdir('../../Backend/nodejs-server')

	ret = client.images.build(path=".", tag="prowess-backend")
	print(ret)
	'''
	print('\n')
	print('############################################################')
	print('Backend Installation Complete')
	print('############################################################')
	print('\n')

def governor(args):
	print('\n')
	print('############################################################')
	print('Installing PROWESS Service')
	print('############################################################')
	print('\n')
	
	try:
		shutil.rmtree('/opt/prowess')
	except:
		pass
	shutil.copytree('Governor','/opt/prowess')

	shutil.copyfile('Service/prowess.service','/etc/systemd/system/prowess.service')
 
	print('\n')
	print('############################################################')
	print('PROWESS Service Installation Complete')
	print('############################################################')
	print('\n')
	return;

def main(args):
    #startup()
    #val = input('Continue? (y/n): ')
    #if(val[0] != 'y'):
    if(False):
        print('Exiting')
    else:
        print('Beginning Installation')
      	    
        if(not (args.frontend or args.backend or args.prowess_svc or args.config or args.all)):
            print('No Installation Options Specified')
            print('Exiting')
            exit()
        if(args.config or args.all):
            config(args)
        if(args.frontend or args.all):
            frontend(args)
        if(args.backend or args.all):
            backend(args)
        if(args.prowess_svc or args.all):
            governor(args)

    print('############################################################')
    print('# Installation  Complete                                   #')
    print('############################################################')

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('-debug', action="store_true", help='Print Debug Information')
    parser.add_argument('-frontend',action="store_true", help='installs react frontend at specific directory')
    parser.add_argument('-backend',action="store_true", help='installs PROWESS backend server and database')
    parser.add_argument('-prowess_svc', action="store_true", help='installs the PROWESS governor application')
    parser.add_argument('-config',action="store_true", help='Configures PROWESS frontend, backend, and governor')
    parser.add_argument('-shib',action="store_true", help="Configures shibboleth")
    parser.add_argument('-all', action="store_true", help='Flag to configure everything')
    
    args = parser.parse_args()
    main(args)
