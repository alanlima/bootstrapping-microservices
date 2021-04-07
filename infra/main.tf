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
  name                = random_string.acr.result
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
  admin_enabled       = true
  sku                 = "Basic"
}