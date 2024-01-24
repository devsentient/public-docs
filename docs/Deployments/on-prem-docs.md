# Shakudo Deployment Notes [Public Access]

This deployment guide is for on-premises / own datacenter deployments from a Windows workstation

## **Prerequisites**

- Ports 22, 6443 and 443 are open and accessible on the host
- User account `shakudo` created on the host, with SSH and password-less sudo access
- Installer machine with SSH access to host

## **Summary of Deployment Steps**

Below is a summary of steps to deploy the Shakudo platform on an on-prem host machine. Additional details are in subsequent sections.

- Place Ubuntu desktop host and deployment client machine on network with Internet access (guest network)
- Install command line tools to enable deployment execution from the client machine (Windows laptop)
- SSH into Ubuntu desktop via PuTTY with Ubuntu internal IP and `shakudo` user to test connection
- From deployment client laptop, bootstrap K3s cluster on Ubuntu desktop through SSH, using `k3sup`
- Apply pre-install YAMLs, helm install Shakudo platform, nvidia gpu operator, and configure keycloak
- Ensure all required images are downloaded onto the Ubuntu desktop
- Spin up test pods and check for gpu allocation and ensure driver compatibility
- Obtain self signed cert from on-prem network admin, extract the cert and key as text and manually apply it as a secret
- Move Ubuntu desktop to private network
- Get access to Citrix or another remote access tool and log into UAT virtual desktop
- SSH into Ubuntu desktop via PuTTY (PuTTY can be found under `C:\temp`)
- Run k9s as cluster admin to visualize the K3s cluster’s resources
- Add domains to /etcd/hosts. Restart KubeDNS. Reboot server
- Delete and recreate the istio-ingressgateway loadbalancer with the new private network IP.
- Ensure network admin creates a DNS records for the new private IP and both base and wildcard domains

## **Ubuntu host setup**

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
    
    Install `docker`
    
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
    
    Pull the Shakudo images with `docker pull [image URL]` for the following image URLs
    
    ```bash
    docker pull gcr.io/devsentient-infra/prod/api-server-base@sha256:de19d9a2c17fd794910e62d10f5eb29a3fe307c7345ba32be51f2347416d2837
    docker pull gcr.io/devsentient-infra/prod/dashboard-v3@sha256:a2e202ca93f90059965d75865336498c16be54d0030a86c67e56744892e2f7e9
    docker pull gcr.io/devsentient-infra/prod/git-server-base@sha256:1e68b65cc78f6382eaf4cc564eba6c80cba3f50909a8972b9a05904843d62f34
    docker pull gcr.io/devsentient-infra/prod/git-sync@sha256:a5740a704db52131ea78d20621604183e6919eb41ae7e4208a937d518de1e464
    docker pull gcr.io/devsentient-infra/prod/jhub-basic@sha256:7d64377f9a969c13ad3f0a5fb0dac839aba8952db091a9da931361edb74ce257
    ```
    
4. **Install remaining tools for Kubernetes**
    
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
    
    Install `nvidia-driver-535-server`. The **server** version of the driver is essential, to prevent the host from going to sleep.
    
    ```bash
    sudo apt update
    sudo apt install nvidia-driver-535-server
    sudo reboot
    nvidia-smi
    ```
    

## **Tools required for Windows Installer machine**

Install `putty`

- Download 64bit Windows Installer from `https://www.putty.org/` and follow prompts

Install `git` and `git bash`

- Download 64bit Windows Installer from `https://git-scm.com/download/win` and follow prompts (make sure to select install git bash with git)

Install `chocolatey (choco)`

- Open up a Windows Powershell terminal with admin access and run:
    
    ```
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
    
    ```
    k3sup --version
    ```
    

Install `java` (required for `kcadm`, which is used to configure user login and access)

- Go to oracle downloads page `https://www.oracle.com/java/technologies/downloads/#java11-windows` and download 64bit Windows Installer `jdk-11.0.21_windows-x64_bin.exe`
- Set `JAVA_HOME` env var
    
    ```
    Find the installation path of the JDK installed in C:\Program Files\Java\jdk-11.0.21
    Right-click on 'This PC' or 'My Computer' on your desktop or in File Explorer, and choose 'Properties'.
    Click on 'Advanced system settings' and then 'Environment Variables'.
    Under 'System Variables', click 'New'.
    For 'Variable name', enter JAVA_HOME. For 'Variable value', enter the path C:\Program Files\Java\jdk-11.0.21
    ```
    
- Add Java to the System Path
    
    ```
    Still in the 'Environment Variables' window, under 'System Variables', find and select the 'Path' variable, then click 'Edit'.
    Click 'New' and add the path to the 'bin' folder within the Java installation directory (C:\Program Files\Java\jdk-11.0.21)
    ```
    
- Open a new git bash terminal to verify the installation, type:
    
    ```
    java -version
    ```
    

Install `kcadm`

- Go to the kcadm downloads page `https://www.keycloak.org/downloads.html` and download the .zip file for keycloak (listed under server)
- Extract the .zip file
- Add Keycloak's bin Directory to System PATH
    
    ```
    Find the path to the bin directory inside the extracted Keycloak folder. It will be something like C:\path\to\keycloak\bin.
    Right-click on 'This PC' or 'My Computer' on your desktop or in File Explorer, and choose 'Properties'.
    Click on 'Advanced system settings' and then 'Environment Variables'.
    Under 'System Variables', find and select the 'Path' variable, then click 'Edit'.
    Click 'New' and add the path to the Keycloak bin directory.
    ```
    
- Open a new git bash terminal to verify the installation, type:
    
    ```
    kcadm.bat
    ```
    

## **Build steps**

### **Create k3s cluster using k3sup**

- Create kubeconfig directory
    
    ```
    cd ~
    mkdir .kube
    ```
    
- Export ubuntu internal ip
    
    ```
    export ubuntu_ip=192.168.24.82
    ```
    
- Start k3s cluster using `k3sup`
    
    ```
    k3sup install --ip $ubuntu_ip --user shakudo --k3s-version v1.25.15+k3s2 --context hyperplane-cluster --local-path ~/.kube/config --no-extras
    ```
    
- Setup kubeconfig
    
    ```
    chmod 770 ~/.kube/config
    export KUBECONFIG=~/.kube/config
    ```
    

### **Delete Traefik resources that were deployed by k3sup**

- Open up PuTTY and SSH into the Ubuntu machine to run k9s
    
    ```
    k9s
    ```
    
- Navigate across `:deployment` `:services` `:configmaps` and `:ingress` in k9s and find traefik resources
- Delete resources by selecting them with the `space-bar` and pressing `ctrl-d`

### **From Windows installer machine, label the cluster node**

- Get the node name
    
    ```
    kubectl get nodes
    ```
    
- Label the node name from the above command with `hyperplane-pool`
    
    ```
    kubectl label nodes TOREPLACE_NODE_NAME hyperplane.dev/nodeType=hyperplane-pool
    ```
    

### **Install NVIDIA gpu-operator via helm**

- Add and update the repo
    
    ```
    helm repo add nvidia https://nvidia.github.io/gpu-operator && helm repo update
    ```
    
- Install gpu-operator
    
    ```
    helm install gpu-operator nvidia/gpu-operator --version v23.9.0 --set driver.enabled=false
    ```
    

### Download **the Shakudo helm chart from GitHub**

- Clone the repo with http url
    
    ```
    cd ~
    git clone https://github.com/devsentient/shakudo-platform-helm-chart.git
    cd shakudo-platform-helm-chart
    ```
    
- Checkout desired branch (with port 22 entry removed from istio operator and istio ingressgateway)
    
    ```
    git checkout desired-release-1.0
    git pull
    ```
    

### **Apply pre-install YAMLs**

- Navigate to shakudo-platform dir
    
    ```
    cd ~/shakudo-platform-helm-chart/charts/shakudo-platform
    ```
    
- Apply static YAMLs
    
    ```
    kubectl apply -f ../../charts/shakudo-platform/static/crds/
    kubectl apply -f ../../charts/shakudo-platform/static/prometheus-0/
    kubectl apply -f ../../charts/shakudo-platform/static/prometheus-1/
    kubectl apply -f ../../charts/shakudo-platform/static/prometheus-2/
    kubectl apply -f ../../charts/shakudo-platform/static/cert-manager/
    ```
    

### **Place values file in current directory**

- Create the values file and paste in the desired values
    
    ```
    vi values-your-company-name.yaml
    ```
    

### **Install Shakudo chart via helm**

- helm install
    
    ```
    helm install shakudo-hyperplane . --values values-your-company-name.yaml --debug
    ```
    

### **Configure keycloak**

- navigate to the script directory and open the script
    
    ```
    cd ~/shakudo-platform-helm-chart/scripts/deployShakudo
    vi configure_keycloak
    ```
    
- Replace all instances of kcadm.sh with kcadm.bat
- In the main function comment out `check_prerequisites check_prerequisites`, `check_parameters`, and `enable_verify_email`
- Set the domain name to localhost:8080
    
    ```
    export DOMAIN_NAME=localhost:8080
    ```
    
- Port forward the keycloak service
    
    ```
    kubectl port-forward -n "hyperplane-core" service/keycloak 8080:8080
    ```
    
- Run the script
    
    ```
    ./configure_keycloak --domain your.company.domain
    ```
    

### **Apply Certs**

- Obtain self signed cert pem file from your network admin which has DNS entries for `your.company.domain` and `*.your.company.domain`
- Extract the cert
    
    ```
    openssl x509 -in yourfile.pem -text -noout
    ```
    
- Extract the key
    
    ```
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
    
    ```
    kubectl apply -f hyperplane-cert.yaml
    kubectl apply -f istio-cert.yaml
    ```
    

## **System specs**

- Ubuntu 20.04.6
- Nvidia driver-535-server
- CUDA 12.2