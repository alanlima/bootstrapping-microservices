resource "azurerm_resource_group" "this" {
  name     = "rg-bootstrapping-microservices"
  location = "Australia Southeast"
}

resource "random_string" "acr" {
  length  = 5
  special = false
  upper   = false
  number  = false
}

resource "azurerm_container_registry" "this" {
  #   name                = "bootstrappingmicroservices"
  name                = "acr${var.project_name}"
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
  admin_enabled       = true
  sku                 = "Basic"
}

resource "azurerm_storage_account" "this" {
  name                     = "st${var.project_name}"
  resource_group_name      = azurerm_resource_group.this.name
  location                 = azurerm_resource_group.this.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "videos" {
  name = "videos"
  storage_account_name = azurerm_storage_account.this.name
  container_access_type = "private"
}

resource "azurerm_storage_blob" "sample_video" {
  name = "SampleVideo.mp4"
  storage_account_name = azurerm_storage_account.this.name
  storage_container_name = azurerm_storage_container.videos.name
  type = "Block"
  source = "../video-streaming/videos/SampleVideo_1280x720_1mb.mp4"
}