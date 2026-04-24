namespace ERP.Domain.Entities;

public class SalesInstallment : BaseEntity
{
    public int SalesInstallmentPlanId { get; set; }
    public SalesInstallmentPlan Plan { get; set; } = null!;

    public int SequenceNumber { get; set; }
    public DateTime DueDate { get; set; }
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; } = 0;
    public string Status { get; set; } = "pending";
}
