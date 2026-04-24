using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ERP.API.Attributes;

/// <summary>
/// Requires the current user to hold "<module>:<level>" in their permission claims.
/// Levels: read, write, delete. Write implies read/write; delete implies delete/write/read on the client side,
/// but the backend check is literal against the claim list.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public sealed class RequirePermissionAttribute : Attribute, IAuthorizationFilter
{
    public string Module { get; }
    public string Level { get; }

    public RequirePermissionAttribute(string module, string level = "read")
    {
        Module = module;
        Level = level;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var ctx = context.HttpContext.RequestServices.GetService(typeof(ICurrentUserContext)) as ICurrentUserContext;
        if (ctx is null || !ctx.IsAuthenticated)
        {
            context.Result = new UnauthorizedResult();
            return;
        }
        if (!ctx.HasPermission(Module, Level))
            context.Result = new ObjectResult(new { message = $"No tiene permiso para {Level} en {Module}." }) { StatusCode = 403 };
    }
}
