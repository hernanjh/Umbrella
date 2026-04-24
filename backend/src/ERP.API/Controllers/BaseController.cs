using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[ApiController]
public abstract class BaseController : ControllerBase
{
    protected int CurrentUserId =>
        int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value, out var id) ? id : 0;

    protected string CurrentUserEmail =>
        User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value ?? "system";
}
