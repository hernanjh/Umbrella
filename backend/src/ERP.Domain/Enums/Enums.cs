namespace ERP.Domain.Enums;

public enum MovementType
{
    Purchase,
    Sale,
    Adjustment,
    Transfer,
    Return
}

public enum InvoiceStatus
{
    Draft,
    Confirmed,
    PartiallyPaid,
    Paid,
    Cancelled,
    Voided
}

public enum PricingMode
{
    Percentage,
    Fixed
}

public enum StockLocationType
{
    Warehouse,
    Seller,
    Transit,
    Virtual
}
