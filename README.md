# ![PROWESS Logo](http://jaysonboubin.com/images/PROWESS.png)

# PROWESS:

PROWESS is an open source kubernetes-based edge experimentation platform. PROWESS allows organizations interested in constrained edge applications to easily test and configure their workloads on a broad range of hardware. PROWESS Links testbeds positioned across these institutions and allows users to parameterize and schedule experiments across these testbeds. PROWESS leverages institutional networks to decrease the cost implementation and burden of experimentation.

PROWESS defines experiments as sets of Docker containers which are orchestrated across a cluster of nodes managed by Kubernetes. Experiments also include resource constraints, hardware requirements, and sensors. PROWESS Experiments are scheduled through a secure web application that integrates easily with institutional SSO technology, meaning PROWESS can quickly become part of your University or Research Lab's ecosystem. 

PROWESS relies on a core-hub/edge-hub model. Core-hubs are compute resources which host PROWESS software and experimentation infrastructure. Edge-hubs are geographically and computationally diverse compute resources and testbeds on which PROWESS experiments can be scheduled. This model allows PROWESS to position its core software at the heart of an institution while integrating testbeds and far-away resources with little additional investment. 

![PROWESS Experimentation](https://jaysonboubin.com/images/PROWESS_OVERVIEW.png)	

How to use PROWESS: You can incorporate PROWESS into your institution in three simple steps: 
    1) Install PROWESS software onto one or more core-hubs.
    2) Connect edge-hubs via Kubernetes to the core-hub.
    3) Provide APIs for experiment containers.

## Prerequisites

* [Apache http Web Server](https://httpd.apache.org/) >=v2.4
* [Python](https://www.python.org/) >=3.6
* [Docker](https://www.docker.com/) >= 20.10
* [Kubernetes](https://kubernetes.io/) >= 1.20
* Optional: [Shibboleth](https://www.shibboleth.net/) >=v3.2
* Optional: A distributed file system (i.e NFS)

## Getting Started

To start using PROWESS, you must first install and configure all prerequisite software including Kubernetes and Apache. Assure that you have an Apache web server configured to host PROWESS at a specific web address, which we will call $PROWESS_ADDR. Next, assure that your Kubernetes cluster is functioning, and that your core-hub is configured to be the Kubernetes master node. You may configure your core-hub to run PROWESS experiments directly by untainting it. 

Next, clone this repository into a directory on your PROWESS core-hub. We will refer to the top level of this directory as $PROWESS throughout this guide. 

### Configuration:

To configure PROWESS, you can edit the configuration file located at $PROWESS/config.json. PROWESS currently supports the following configuration options:

* domain: Should be set to $PROWESS_ADDR
* databaseIP: The IP of the PROWESS Database (default 127.0.0.1)
* databasePort: The port of the PROWESS Database (default 3306)
* databasePW: The password of the PROWESS Database (default "my-secret-pw")
* databaseUser: The mysql user of the PROWESS Database (default root)
* sslcert: An optional SSL cert if necessary for your applications (no default)
* publickey: An optional public key if necessary for your applications (no default)
* webpath: The path to the apache-hosted PROWESS webapp (no default)
* authtype: Type of authentication used by the PROWESS Webapp (shibboleth | default: none)

### Installation:

#### Core-hubs: 

To install PROWESS on your core-hub, you can run the PROWESS installation script located in $PROWESS/install.py. This script must be run with sudo access to fully install PROWESS. This script provides the following options:

* -config: Reconfigures PROWESS for installation based on the $PROWESS/config.json file
* -frontend: Installs the PROWESS webapp to the directory specified by the configured webpath
* -backend: Installs the PROWESS web backend to webpath/php/
* -prowess_svc: Installs the PROWESS systemd service which runs the corehub scheduler
* -debug: Outputs debug information while installing
* -all: runs -config -frontend -backend -prowess_svc

If run on a properly configured system, this will install all PROWESS software for the corehub.

#### Edge-hubs:

To install software on edge-hubs, PROWESS simply requires kubernetes. On each edge-hub, join the PROWESS kubernetes cluster using kubeadm. 

To configure an edge hub for scheduling, create an edgehub configuration file in $PROWESS/Governor/profiles. These files yaml files specify all resources available from a specific edgehub. They include the following variables:

* name: The name of this testbed that PROWESS users will see
* hostmane: The hostname of this system as seen by Kubernetes
* RAM: The maximum amount of RAM (in GB) that this testbed can dedicate to PROWESS experiments
* CPUs: The maximum number of CPUs this testbed can dedicate to PROWESS experiments
* Sensors: Sensors available from this testbed (e.g SDRs, UAVs, Cameras, Microphones)
* Hardware: Hardware available from this testbed (e.g GPUs, TPUs, FPGAs)
* EventColor: The RGB Hex color associated with PROWESS webapp calendar entries for this testbed

Once a profile is configured, reinstall the PROWESS service using the PROWESS installer. 

### Run:

To run PROWESS, you must first have installed all of its components. 

Once all components are installed, follow the instructions below:
* 1: start the PROWESS database in Kubernetes by 
 * apply the PROWESS database kubernetes deployment in $PROWESS/deployments
* 2: start the PROWESS service
 * If using systemd, simply start or restart the PROWESS service

That's it! You've installed and run PROWESS! Check your web path to see if PROWESS works. 

### Next Steps:

To realize a full PROWESS installation, you must provide access to sensors at each testbed. This usually necessitates providing custom containers or APIs to access sensor data from each edge-hub. This can be done by using a simple REST api, or providing specific devices or privileges to containers. The important point is that this must be custom, as all sensors are different. If you have any questions about how we customize edge-hubs, feel free to reach out!

## Future Directions:

PROWESS is constantly under development. In the near future, the PROWESS team plans to provide support for some of the following features.

* Explicit support for Sensor multiplexing across institutional networks
* Explicit support for software defined networking
* Tools for right-sizing workloads on PROWESS
* Support for authentication platforms beyond Shibboleth
* Example testbed containers and APIs for developers

## PROWESS Team

### Who are we?

PROWESS Started at Ohio State University in 2020. It has grown over the years to Binghamton University in 2022 and hopefully will grow further in the years to come. We are always looking for new ideas and new collaborators. If you are interested in collaborating, reach out to Jayson or Anish. 

#### PIs

* **[Jayson Boubin](http://jaysonboubin.com)** - *Lead Developer* - Assistant Professor at Binghamton University (BU)
* **[Anish Arora](https://web.cse.ohio-state.edu/~arora.9/)** - Professor and Chair, Ohio State University (OSU)
* **[Rajiv Ramnath](https://cse.osu.edu/people/ramnath.6)** - Professor of Practice, OSU
* **[Kannan Srinivasan](http://web.cse.ohio-state.edu/~athreya.14/)** - Professor, OSU

#### Staff

* Steve Chang - OSU

#### Students

* Avishek Banerjee - OSU
* Jihoon Yun - OSU
* Aniruddha Rakshit - BU
* Haiyang Qi - OSU
* Yuting Fang - OSU
* Salil Reddy - OSU

See also the list of [contributors](https://github.com/boubinjg/PROWESS/contributors) who participated in this project.

### Papers

* [PROWESS: An Open Testbed for Programmable Wireless Edge Systems](https://www.researchgate.net/profile/Jayson-Boubin-2/publication/361092776_PROWESS_An_Open_Testbed_for_Programmable_Wireless_Edge_Systems/links/629b834ba3fe3e3df85c4906/PROWESS-An-Open-Testbed-for-Programmable-Wireless-Edge-Systems.pdf)

### Grants

This research was generously funded by the following programs: 

* NSF CC* Integration Award (2018912)
* NSF Graduate Research Fellowship (DGE-1343012)

## License

This project is licensed under the MIT License - see the [License](LICENSE) file for details
