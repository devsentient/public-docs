# Shakudo K3s Deployment Instructions

This deployment guide is for on-premises / own datacenter deployments from a Windows workstation

# **Prerequisites**

- Ports 22, 6443 and 443 are open and accessible on the host
- User account `shakudo` created on the host, with SSH and password-less sudo access. The host machine can be a Ubuntu or RHEL bare metal or VM, and is referred to as “********************Ubuntu host machine”******************** in the document.
- Installer machine with SSH access to host. The installer can be a Windows or Ubuntu machine, and is referred to as “********************Windows client machine”******************** in the document. The following instructions are written assuming a Windows client machine with a Linux-emulator — the commands for Linux are very similar.
- Ensure you can see your GPUs with `nvidia smi` in your K3s host machine

# Summary of D**eployment Steps**

Below is a summary of steps to deploy the Shakudo platform on an on-prem host machine with Ubuntu 20.04 or RHEL. Additional details are in subsequent sections.

- Place the Ubuntu host and Windows client machines on the same network with Internet access
- Install the necessary command line tools to enable deployment execution from the Windows client machine
- SSH into the Ubuntu host via PuTTY, with Ubuntu internal IP and `shakudo` user to test the connection
- From the Windows client machine, bootstrap a K3s cluster on Ubuntu host through SSH, using `k3sup`
- Apply pre-install YAMLs, helm install Shakudo platform, NVIDIA gpu operator, and configure keycloak
- Ensure all required images are downloaded onto the Ubuntu host
- Create test pods to check for GPU allocation and ensure driver compatibility
- Obtain self signed cert from on-prem network admin, extract the cert and key as text and  apply it as a K8s secret
- Move Ubuntu desktop to private network
- Get access to Citrix or another remote access tool and log into UAT virtual desktop
- SSH into Ubuntu desktop via PuTTY (PuTTY can be found under `C:\temp`)
- Run k9s as cluster admin to visualize the K3s cluster’s resources
- Add domains to /etcd/hosts. Restart KubeDNS. Reboot server
- Delete and recreate the istio-ingressgateway loadbalancer with the new private network IP.
- Ensure network admin creates a DNS records for the new private IP and both base and wildcard domains

# **Ubuntu host machine setup**

1. **Install Docker:**
    
    Set up apt repo for docker
    
    ```bash
    # Add Docker's official GPG key:
    sudo apt-get update
    sudo apt-get install ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Add the repository to Apt sources:
    echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    ```
    
    Install `docker` if it does not already exist
    
    ```bash
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ```
    
2. **Install `gcloud`**
    
    Import Google Cloud public key.
    
    ```bash
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
    ```
    
    Add the gcloud CLI distribution URI as a package source.
    
    ```bash
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
    ```
    
    Update and install the gcloud CLI.
    
    ```bash
    sudo apt-get update && sudo apt-get install google-cloud-cli
    ```
    
    Run gcloud init.
    
    ```bash
    gcloud init
    ```
    
3. **Pull Shakudo images:** 
    
    Download the service account credentials file from 1Password at the link provided to you by the Shakudo team. 
    
    Activate the service account
    
    ```bash
    gcloud auth activate-service-account --key-file=path/to/keyfile.json
    ```
    
    Configure docker to use the gcloud credentials
    
    ```bash
    gcloud auth configure-docker; gcloud auth configure-docker gcr.io
    ```
    
    Pull the Shakudo images with `docker pull [image URL]` all the required Shakudo images. All Shakudo images follow the format [`gcr.io/shakudo-platform/](http://gcr.io/shakudo-platform/apps/k9s-admin)IMAGE_NAME:RELEASE` but the specific digests will be provided as well. At this point you can do additional image scanning if you would like.
    
4. **Install the remaining tools for Kubernetes**
    
    Install `k9s`. k9s is a tool to visualize nodes and cluster resources like pods, secrets, etc.
    
    ```bash
    sudo apt update
    sudo apt upgrade -y
    sudo apt install curl tar -y
    curl -Lo k9s.tar.gz https://github.com/derailed/k9s/releases/download/v0.25.18/k9s_Linux_x86_64.tar.gz
    tar -zxvf k9s.tar.gz
    sudo mv k9s /usr/local/bin
    
    k9s version
    ```
    
    Install `kubectl`. Kubectl is a command line tool to communicate with KubeAPI.
    
    ```bash
    sudo apt update
    sudo apt install -y kubectl
    
    kubectl version --client
    ```
    
    Install `nvidia-driver-535-server`. The **server** version of the driver is essential, to prevent the host from going to sleep. If you already have NVIDIA drivers set up and they are on a different version, please let the Shakudo team know which version you are on. 
    
    ```bash
    sudo apt update
    sudo apt install nvidia-driver-535-server
    sudo reboot
    
    nvidia-smi
    ```
    

# **Windows client machine setup**

These steps are only required if your client machine is running Windows. For Linux, skip to “Install `helm` `kubectl` and `jq`".

Install `putty`

- Download 64bit Windows Installer from `https://www.putty.org/` and follow prompts

Install `git` and `git bash`

- Download 64bit Windows Installer from `https://git-scm.com/download/win` and follow prompts (make sure to select install git bash with git)

Install `chocolatey (choco)`

- Open up a Windows Powershell terminal with admin access and run:
    
    ```bash
    Get-ExecutionPolicy
    ```
    
- If it returns Restricted, then run
    
    ```
    Set-ExecutionPolicy AllSigned
    ```
    
    ```
    Set-ExecutionPolicy Bypass -Scope Process
    ```
    
- Now run:
    
    ```
    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    ```
    

---

Install `helm` `kubectl` and `jq`

- In Windows Powershell terminal with admin access run:
    
    ```
    choco install kubernetes-helm
    choco install kubernetes-cli
    choco install jq
    ```
    

Install `k3sup`

- Go to the k3sup releases page `https://github.com/alexellis/k3sup/releases` and download the .exe file for version `0.13.3`
- Add k3sup to the PATH
    
    ```
    For Windows:
    - Press Windows key + S on your keyboard to open the search bar.
    - Type “environment variables” and select “Edit the system environment variables” from the search results.
    - In the System Properties window that appears, click on the Environment Variables.
    - In the Environment Variables window, under the "System variables" section, scroll down and find the variable named Path. Select it, then click Edit.
    - In the Edit Environment Variable window, you'll see a list of directories already included in your PATH.
    - Click New and type the full path to the directory where you placed k3sup.exe.
    - Click OK and apply these changes.
    ```
    
- Open a new git bash terminal to verify the installation, type:
    
    ```bash
    k3sup --version
    ```
    

Install `java` (required for `kcadm`, which is used to configure user login and access)

- Go to oracle downloads page `https://www.oracle.com/java/technologies/downloads/#java11-windows` and download 64bit Windows Installer `jdk-11.0.21_windows-x64_bin.exe`
- Set `JAVA_HOME` env var
    
    ```
    For Windows:
    
    - Find the installation path of the JDK installed in C:\Program Files\Java\jdk-11.0.21
    - Right-click on 'This PC' or 'My Computer' on your desktop or in File Explorer, and choose 'Properties'.
    - Click on 'Advanced system settings' and then 'Environment Variables'.
    - Under 'System Variables', click 'New'.
    - For 'Variable name', enter JAVA_HOME. For 'Variable value', enter the path C:\Program Files\Java\jdk-11.0.21
    ```
    
- Add Java to the System Path
    
    ```
    For Windows:
    - Still in the 'Environment Variables' window, under 'System Variables', find and select the 'Path' variable, then click 'Edit'.
    - Click 'New' and add the path to the 'bin' folder within the Java installation directory (C:\Program Files\Java\jdk-11.0.21)
    ```
    
- Open a new git bash terminal to verify the installation, type:
    
    ```
    java -version
    ```
    

Install `kcadm`

- Go to the kcadm downloads page `https://www.keycloak.org/downloads.html` and download the .zip file for keycloak (listed under server)
- Extract the .zip file
- Add Keycloak's bin Directory to System PATH.
    
    ```
    If you are on Windows, use the following:
    - Find the path to the bin directory inside the extracted Keycloak folder. It will be something like C:\path\to\keycloak\bin.
    - Right-click on 'This PC' or 'My Computer' on your desktop or in File Explorer, and choose 'Properties'.
    - Click on 'Advanced system settings' and then 'Environment Variables'.
    - Under 'System Variables', find and select the 'Path' variable, then click 'Edit'.
    - Click 'New' and add the path to the Keycloak bin directory.
    ```
    
- Open a new git bash terminal to verify the installation, type:
    
    ```
    kcadm.bat
    ```
    

# **Build steps**

### **Create k3s cluster using k3sup**

- Create kubeconfig directory
    
    ```bash
    cd ~
    mkdir .kube
    ```
    
- Export ubuntu internal ip
    
    ```bash
    export ubuntu_ip=192.168.24.82 # Replace this with your host's IP
    ```
    
- Start k3s cluster using `k3sup`
    
    ```bash
    k3sup install --ip $ubuntu_ip --user shakudo --k3s-version v1.25.15+k3s2 --context hyperplane-cluster --local-path ~/.kube/config --no-extras
    ```
    
- Setup kubeconfig
    
    ```bash
    chmod 770 ~/.kube/config
    export KUBECONFIG=~/.kube/config
    ```
    

### L**abel the cluster node**

Run these commands from your Windows client machine

- Get the node name
    
    ```bash
    kubectl get nodes
    ```
    
- Label the node name from the above command with `hyperplane-pool`
    
    ```bash
    kubectl label nodes TOREPLACE_NODE_NAME hyperplane.dev/nodeType=hyperplane-pool
    ```
    

### **Install NVIDIA gpu-operator via helm**

- Add and update the repo
    
    ```bash
    helm repo add nvidia https://nvidia.github.io/gpu-operator && helm repo update
    ```
    
- Install gpu-operator
    
    ```bash
    helm install gpu-operator nvidia/gpu-operator --version v23.9.0 --set driver.enabled=false
    ```
    

### Download **the Shakudo helm chart from GitHub**

- Clone the repo with http url
    
    ```bash
    cd ~
    git clone https://github.com/devsentient/shakudo-platform-helm-chart.git
    cd shakudo-platform-helm-chart
    ```
    
- Checkout desired branch
    
    ```bash
    git checkout desired-release-1.0
    git pull
    ```
    

### **Apply pre-install YAMLs**

- Navigate to shakudo-platform dir
    
    ```bash
    cd ~/shakudo-platform-helm-chart/charts/shakudo-platform
    ```
    
- Apply static YAMLs
    
    ```bash
    kubectl apply -f ../../charts/shakudo-platform/static/crds/
    kubectl apply -f ../../charts/shakudo-platform/static/prometheus-0/
    kubectl apply -f ../../charts/shakudo-platform/static/prometheus-1/
    kubectl apply -f ../../charts/shakudo-platform/static/prometheus-2/
    kubectl apply -f ../../charts/shakudo-platform/static/cert-manager/
    ```
    

### **Place values file in current directory**

- Create the values file and paste in the desired values
    
    ```bash
    vi values-your-company-name.yaml
    ```
    

### **Install Shakudo chart via helm**

- helm install
    
    ```bash
    helm install shakudo-hyperplane . --values values-your-company-name.yaml --debug
    ```
    

### **Configure keycloak**

- navigate to the script directory and open the script
    
    ```
    cd ~/shakudo-platform-helm-chart/scripts/deployShakudo
    vi configure_keycloak
    ```
    
- Replace all instances of kcadm.sh with kcadm.bat if you are on Windows
- In the main function comment out `check_prerequisites check_prerequisites`, `check_parameters`, and `enable_verify_email`
- Set the domain name to localhost:8080
    
    ```bash
    export DOMAIN_NAME=localhost:8080
    ```
    
- Port forward the keycloak service
    
    ```bash
    kubectl port-forward -n "hyperplane-core" service/keycloak 8080:8080
    ```
    
- Run the script
    
    ```bash
    ./configure_keycloak --domain your.company.domain
    ```
    

### **Apply Certs**

- Obtain self signed cert pem file from your network admin which has DNS entries for `your.company.domain.for.shakudo` and `*.your.company.domain.for.shakudo`
- Extract the cert
    
    ```bash
    openssl x509 -in yourfile.pem -text -noout
    ```
    
- Extract the key
    
    ```bash
    openssl pkey -in yourfile.pem -text -noout
    ```
    
- Create the YAMLs for the cert secrets
    
    ```
    vi hyperplane-cert.yaml
    ```
    
    ```yaml
    apiVersion: v1
    kind: Secret
    type: kubernetes.io/tls
    metadata:
        name: ingressgateway-wc-certs
        namespace: hyperplane-istio
    data:
        tls.crt: <extracted value base64 encoded>
        tls.key: <extracted value base64 encoded>
    ```
    
    ```
    vi istio-cert.yaml
    ```
    
    ```yaml
    apiVersion: v1
    kind: Secret
    type: kubernetes.io/tls
    metadata:
        name: ingressgateway-wc-certs
        namespace: istio-system
    data:
        tls.crt: <extracted value base64 encoded>
        tls.key: <extracted value base64 encoded>
    ```
    
- Apply the certs
    
    ```bash
    kubectl apply -f hyperplane-cert.yaml
    kubectl apply -f istio-cert.yaml
    ```
    

# **System specs**

- Ubuntu 20.04.6 or RHEL8
- Nvidia driver-535-server
- CUDA 12.2 ana 11.8