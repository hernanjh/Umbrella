using System.Linq.Expressions;
using ERP.Domain.Entities;
using ERP.Domain.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(int id) =>
        await _dbSet.FindAsync(id);

    public virtual async Task<T?> GetByCodeAsync(string code) =>
        await _dbSet.FirstOrDefaultAsync(e => e.Code == code);

    public virtual async Task<IEnumerable<T>> GetAllAsync(bool includeDeleted = false)
    {
        var query = includeDeleted ? _dbSet.IgnoreQueryFilters() : _dbSet;
        return await query.ToListAsync();
    }

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate) =>
        await _dbSet.Where(predicate).ToListAsync();

    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    public virtual Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    public virtual async Task SoftDeleteAsync(int id, string deletedBy)
    {
        var entity = await _dbSet.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException($"Entity {typeof(T).Name} with id {id} not found.");
        entity.IsDeleted = true;
        entity.DeletedBy = deletedBy;
        entity.DeletedAt = DateTime.UtcNow;
        _dbSet.Update(entity);
    }

    public virtual async Task<bool> ExistsAsync(int id) =>
        await _dbSet.AnyAsync(e => e.Id == id);

    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        if (predicate == null) return await _dbSet.CountAsync();
        return await _dbSet.CountAsync(predicate);
    }

    public virtual IQueryable<T> Query(bool includeDeleted = false) =>
        includeDeleted ? _dbSet.IgnoreQueryFilters() : _dbSet;
}
