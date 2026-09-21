# Web Contract: Inventory

- `/inventario` lists lots and statuses.
- `/api/inventory/lots` proxies lot creation.
- `/api/inventory/adjustments` proxies signed adjustments.
- `/api/inventory/lots/[lotId]/movements` proxies history.

Errors map to semantic unavailable/forbidden/conflict/retry states; tokens remain server-only.
