output "container_registry" {
  value = {
    registry_url   = azurerm_container_registry.this.login_server
    admin_username = azurerm_container_registry.this.admin_username
    admin_password = azurerm_container_registry.this.admin_password
  }
}

output "storage" {
  value = {
    name = azurerm_storage_account.this.name
    blob_endpoint = azurerm_storage_account.this.primary_blob_endpoint
    access_key = azurerm_storage_account.this.primary_access_key
    connection_string = azurerm_storage_account.this.primary_connection_string
  }
}