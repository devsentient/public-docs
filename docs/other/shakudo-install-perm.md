# Shakudo installation in Azure

## Permissions for Installation in Azure

We will need permissions for the following to create and operate the cluster (see [Azure docs](https://learn.microsoft.com/en-us/azure/aks/concepts-identity#aks-service-permissions) for reference):

- Microsoft.Compute/diskEncryptionSets/read
- Microsoft.Compute/proximityPlacementGroups/write
- Microsoft.Network/applicationGateways/read
- Microsoft.Network/applicationGateways/write
- Microsoft.Network/virtualNetworks/subnets/join/action
- Microsoft.Network/publicIPAddresses/join/action
- Microsoft.Network/publicIPPrefixes/join/action
- Microsoft.OperationalInsights/workspaces/sharedkeys/read
- Microsoft.OperationalInsights/workspaces/read
- Microsoft.OperationsManagement/solutions/write
- Microsoft.OperationsManagement/solutions/read
- Microsoft.ManagedIdentity/userAssignedIdentities/assign/action
- Microsoft.Network/virtualNetworks/joinLoadBalancer/action

We will need the following permissions for the AKS cluster identity, which is created and associated with the AKS cluster:

- Microsoft.ContainerService/managedClusters/*
- Microsoft.Network/loadBalancers/delete
- Microsoft.Network/loadBalancers/read
- Microsoft.Network/loadBalancers/write
- Microsoft.Network/publicIPAddresses/delete
- Microsoft.Network/publicIPAddresses/read
- Microsoft.Network/publicIPAddresses/write
- Microsoft.Network/publicIPAddresses/join/action
- Microsoft.Network/networkSecurityGroups/read
- Microsoft.Network/networkSecurityGroups/write
- Microsoft.Compute/disks/delete
- Microsoft.Compute/disks/read
- Microsoft.Compute/disks/write
- Microsoft.Compute/locations/DiskOperations/read
- Microsoft.Storage/storageAccounts/delete
- Microsoft.Storage/storageAccounts/listKeys/action
- Microsoft.Storage/storageAccounts/read
- Microsoft.Storage/storageAccounts/write
- Microsoft.Storage/operations/read
- Microsoft.Network/routeTables/read
- Microsoft.Network/routeTables/routes/delete
- Microsoft.Network/routeTables/routes/read
- Microsoft.Network/routeTables/routes/write
- Microsoft.Network/routeTables/write
- Microsoft.Compute/virtualMachines/read
- Microsoft.Compute/virtualMachines/write
- Microsoft.Compute/virtualMachineScaleSets/read
- Microsoft.Compute/virtualMachineScaleSets/virtualMachines/read
- Microsoft.Compute/virtualMachineScaleSets/virtualmachines/instanceView/read
- Microsoft.Network/networkInterfaces/write
- Microsoft.Compute/virtualMachineScaleSets/write
- Microsoft.Compute/virtualMachineScaleSets/delete
- Microsoft.Compute/virtualMachineScaleSets/virtualmachines/write
- Microsoft.Network/networkInterfaces/read
- Microsoft.Compute/virtualMachineScaleSets/virtualMachines/networkInterfaces/read
- Microsoft.Compute/virtualMachineScaleSets/virtualMachines/networkInterfaces/ipconfigurations/publicipaddresses/read
- Microsoft.Network/virtualNetworks/read
- Microsoft.Network/virtualNetworks/subnets/read
- Microsoft.Compute/snapshots/delete
- Microsoft.Compute/snapshots/read
- Microsoft.Compute/snapshots/write
- Microsoft.Compute/locations/vmSizes/read
- Microsoft.Compute/locations/operations/read