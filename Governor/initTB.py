import time
import mysql.connector
import subprocess
import glob
import yaml
import io

def loadTestbeds(cursor):

	for f in glob.glob('./profiles/*'):
		cmd = 'INSERT INTO testbed_entries (name, ram, cpus, sensors, hardware, eventcolor) VALUES '

		with io.open(f, 'r') as stream:
			data = yaml.safe_load(stream)

		sensorsList = ''
		hwList = ''
		for i in data['Sensors']:
			sensorsList += i+'+'
		for i in data['Hardware']:
			hwList += i+'+'

		cmd += '(\''+str(data['name'])+'\','
		cmd += '\''+str(data['RAM'])+'\','
		cmd += '\''+str(data['CPUs'])+'\','
		cmd += '\''+sensorsList[:-1]+'\','
		cmd += '\''+hwList[:-1]+'\','
		cmd += '\''+str(data['EventColor'])+'\');'


		print(cmd)
		cursor.execute(cmd)
		print('Done')
		result=cursor.fetchone()
		print(result)

	return;

#Loads all testbed entries present in /profiles into the PROWESS database
def init():
    cnx = mysql.connector.connect(user='root',
			  password='my-secret-pw',
			  host='localhost',
			  port='3306',
			  use_pure=False)
    cursor = cnx.cursor()

    cmd = 'USE calendar;'
    cursor.execute(cmd)

    loadTestbeds(cursor)
    cnx.commit()
