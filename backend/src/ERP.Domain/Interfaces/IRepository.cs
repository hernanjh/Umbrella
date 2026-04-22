using System.Linq.Expressions;
using ERP.Domain.Entities;

namespace ERP.Domain.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(int id);
    Task<T?> GetByCodeAsync(string code);
    Task<IEnumerable<T>> GetAllAsync(bool includeDeleted = false);
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task SoftDeleteAsync(int id, string deletedBy);
    Task<bool> ExistsAsync(int id);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);
    IQueryable<T> Query(bool includeDeleted = false);
}
