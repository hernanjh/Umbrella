namespace ERP.Application.DTOs.Common;

public record PagedResultDto<T>(
    IEnumerable<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

public record QueryParamsDto(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? SortBy = null,
    string SortDir = "asc",
    bool IncludeDeleted = false
);

public record ApiResponseDto<T>(bool Success, T? Data, string? Message, IEnumerable<string>? Errors = null);
