import mysql.connector
from datetime import date, time, datetime, timedelta
import time
import subprocess
import shutil
from initTB import init

jobList = []

waitQueue = []
runQueue = []

class ScheduleItem:
	startTime: datetime
	endTime: datetime
	uid: int
	name: str
	CONT: bool
	YAML: bool
	def __init__(self, startTime, endTime, uid, sdr, name, CONT, YAML):
		self.startTime = startTime
		self.endTime = endTime
		self.uid = uid
		self.sdr = sdr
		self.name = name
		self.CONT = CONT
		self.YAML = YAML

def executeQuery(query):
	cnx = mysql.connector.connect(user='root',
			      	      password='my-secret-pw',
			              host='192.168.0.2',
			              port='3306',
			              database='calendar')

	cursor = cnx.cursor()
	cursor.execute(query)

	obj = cursor.fetchall()
	cnx.commit()

	return obj


def checkForNewJobs(date):
	curJobList = []
	select = 'select * from calendar_entries where `start_date` >= STR_TO_DATE(\''+today+' 00:00:00\', \'%d/%m/%Y %H:%i:%s\');'

	obj = executeQuery(select)

	for job in obj:
		curJobList.append(job)
	return curJobList

def updateStatus(id, status):
	status = status.replace('\'','').replace('\n','')
	query = "UPDATE calendar_entries SET status = \'"+status+"\' WHERE id = \'"+str(id)+"\';"
	obj = executeQuery(query)

def buildYAML(job, status):
	uid = job[0]
	YAML = job[3]
	with open('jobs/experiment_YAML'+str(uid), 'w') as f:
		f.write(YAML)


def buildCron(job, status):
	sdr = job[-2]
	uid = job[0]
	containers = job[2].split(',')
	volumes = job[4].split(',')

	yaml = ""
	yaml += "apiVersion: v1\n"
	yaml += "kind: Pod\n"
	yaml +=	"metadata:\n"
	yaml += "  name: experiment"+str(uid)+"\n"
	yaml += "spec:\n"
	if(sdr):
		yaml += "  hostNetwork: true\n"
	yaml +=	"  containers:\n"
	count = 0
	for c in containers:
		yaml += "  - image: "+c+"\n"
		yaml += "    name: experiment"+str(uid)+"-"+str(count)+"\n"
		count += 1
		yaml += "    volumeMounts:\n"
		yaml += "    - name: volume"+str(uid)+"-0\n"
		yaml += "      mountPath: /output\n"
		if(sdr):
			yaml += "    - name: dev-sdn"+str(uid)+"\n"
			yaml += "      mountPath: /dev/sdn\n"
			yaml += "    - name: p37"+str(uid)+"\n"
			yaml += "      mountPath: /persistent-37\n"

		vcount = 1
		for v in volumes:
			if(v != ''):
				yaml += "    - name: volume"+str(uid)+"-"+str(vcount)+"\n"
				yaml += "      mountPath: /"+v+"\n"
				vcount += 1

	if(sdr):
		yaml += "    securityContext:\n"
		yaml += "      privileged: true\n"
		yaml += "    tty: true\n"

	yaml +=	"  volumes:\n"
	yaml += "  - name: volume"+str(uid)+"-0\n"
	yaml += "    hostPath:\n"
	yaml += "      path: /edgestorage/"+str(uid)+"-output\n"
	yaml += "  - name: dev-sdn"+str(uid)+"\n"
	yaml += "    hostPath:\n"
	yaml += "      path: /dev/sdn\n"
	yaml += "  - name: p37"+str(uid)+"\n"
	yaml += "    hostPath:\n"
	yaml += "      path: /home/gnuradio/persistent/"+str(uid)+'\n'

	vcount = 1
	for v in volumes:
		if(v != ""):
			yaml += "  - name: volume"+str(uid)+"-"+str(vcount)+"\n"
			yaml += "    hostPath:\n"
			yaml += "      path: /edgestorage/"+str(uid)+"-"+str(vcount)+"\n"
			vcount += 1

	with open('jobs/experiment'+str(uid), 'w') as f:
		f.write(yaml)

	print('Kubernetes YAML file built for experiment '+str(uid))
	return uid


def pull(container):
	print('pulling Container')

	proc = subprocess.Popen(['sudo','docker','pull', container], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	out, err = proc.communicate()

	status = ''
	if(err != b''):
		status = 'error pulling container: '+err.decode('utf-8')
	else:
		status = 'Scheduled'
		print('Container Successfully Pulled')

	updateStatus(job[0], status)
	return status

def getTime(day, dtime):
	#print(time.format("HH:MM:SS"))
	print(day + dtime)

def addToSchedule(job, uid, Cont, Yaml, name):
	sched = ScheduleItem('str', 'str', '1', '1',name, Cont, Yaml)
	sched.startTime = job[5] + job[7]
	sched.endTime = job[6] + job[8]
	sched.uid = job[0]
	sched.sdr = job[-2]

	waitQueue.append(sched)
	print('Experiment '+str(uid)+' added to the Wait Queue')

def startJob(job):
	if(job.sdr):
		proc = subprocess.Popen(['sudo', 'sysctl', '-w', 'kernel.shmmax=10000000000'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		out, err = proc.communicate()
		print(out)
		print(err)

	if(job.YAML):
		proc = subprocess.Popen(['kubectl','apply','-f', 'jobs/experiment_YAML'+str(job.uid)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	out, err = proc.communicate()

	if(job.CONT):
		proc = subprocess.Popen(['kubectl','apply','-f', 'jobs/experiment'+str(job.uid)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		out, err = proc.communicate()

	waitQueue.remove(job)
	runQueue.append(job)

	print("Starting Experiment "+str(job.uid))
	print("Output: "+out.decode('utf-8'))
	print("Error Output: "+err.decode('utf-8'))

	status = ''
	if(err != b''):
		status = 'error starting container: '+err.decode('utf-8')
	else:
		proc = subprocess.Popen(['kubectl','expose','deployment',job.name,'--type=LoadBalancer'])

		time.sleep(5)

		proc = subprocess.Popen(['kubectl','get','svc'], stdout=subprocess.PIPE)
		out, err = proc.communicate()

		port = getPort(out, job.name)

		status = 'Running'
		if(port != None):
			status = 'Running, exposed on port '+port

		print('Container Successfully Pulled')

	updateStatus(job.uid, status)

def getPort(out, name):
	outstr = out.decode('utf-8')
	sp = outstr.split('\n')

	for kubeline in sp:
		splitline = kubeline.split()
		try:
			if(splitline[0] == job.name):
				return splitline[4]
		except:
			pass;
	return None

def endJob(job):
	proc = subprocess.Popen(['kubectl','delete','pod', 'experiment'+str(job.uid)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	out, err = proc.communicate()

	runQueue.remove(job)

	print("Ended Experiment "+str(job.uid))
	print("Output: "+out.decode('utf-8'))
	print("Error Output: "+err.decode('utf-8'))

	status = ''
	if(err != b''):
		status = 'error starting container: '+err.decode('utf-8')
	else:
		status = 'Complete'
		print('Container Successfully Pulled')

	updateStatus(job.uid, status)
	shutil.make_archive('/edgestorage/export/'+str(job.uid), 'zip','/edgestorage/'+str(job.uid)+'-output/')


def scheduleJob(job):
	uid = job[0]
	SDR = job[-2]
	containers = job[2].split(',')
	YAML = job[3]
	#print(containers)
	#print(YAML)

	for c in containers:
		status = pull(c)

	CONT = False
	YAML = False

	name = 'experiment'+str(uid)

	if(containers[0] != ""):
		uid = buildCron(job, status)
		CONT = True

	if(YAML != ""):
		buildYAML(job, status)
		YAML = True
		lines = job[3].split('\n')
		for i in range(len(lines)):
			if(lines[i].split(':')[0] == "metadata"):
				try:
					name = lines[i+1].split(':')[1].strip()
				except:
					pass

		addToSchedule(job, uid, CONT, YAML, name)

def initTestbedTable():
    print('Initializing Testbed Entries in PROWESS DB')
    init()

if __name__ == "__main__":

        initTestbedTable()
        exit()
        while(True):
                today = date.today().strftime("%d/%m/%Y")
                now = datetime.now() - timedelta(days = 1)
                now2 = datetime.now() + timedelta(days=1)
                freshJobs = checkForNewJobs(today)

                for job in freshJobs:
                    if(job[0] not in jobList):
                        scheduleJob(job)
                        jobList.append(job[0])
                for job in runQueue:
                    if(job.endTime < now2):
                        endJob(job)

                for job in waitQueue:
                    print(job.startTime, now2)
                    if(job.startTime > now):
                        startJob(job)

                print('sleep')
                time.sleep(10)
        exit()
