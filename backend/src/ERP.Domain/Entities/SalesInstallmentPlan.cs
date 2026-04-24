namespace ERP.Domain.Entities;

public class SalesInstallmentPlan : BaseEntity
{
    public int SalesInvoiceId { get; set; }
    public SalesInvoice SalesInvoice { get; set; } = null!;

    public string Frequency { get; set; } = "monthly";
    public int NumberOfInstallments { get; set; }
    public DateTime StartDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "active";

    public ICollection<SalesInstallment> Installments { get; set; } = new List<SalesInstallment>();
}
