output "container_registry" {
  value = {
    registry_url            = azurerm_container_registry.this.login_server
    admin_username = azurerm_container_registry.this.admin_username
    admin_password = azurerm_container_registry.this.admin_password
  }
}