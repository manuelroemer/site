---
draft: true
date: 2023-11-09T14:23:17+01:00
lastmod: null
title: "Complex Authorization Policy Setups Using ASP.NET Core's IAuthorizationPolicyProvider"
description: null
summary: An overview about ASP.NET's `IAuthorizationPolicyProvider` interface and how it can be leveraged to solve complex authorization policy issues.
tags: [c#, asp.net]
---

In ASP.NET Core, authorization policies are typically registered in the service's startup code, for example via a setup like this:

```cs
services.AddAuthorization(options =>
{
    options.AddPolicy("OnlyAdmin", policy => policy.RequireRole("Admin"));
    options.AddPolicy("OnlyUser", policy => policy.RequireRole("User"));
});
```

The above snippet registers two authorization policies with two different role requirements. The `OnlyAdmin` policy requires a user to have the `Admin` role while the `OnlyUser` policy requires a user to have the `User` role. This works well if all roles and required policies are known at startup. But what if they are not?

Let's assume that we are writing a service where an endpoint is authorized via a `CanEditContent` authorization policy. Users allowed to edit arbitrary content must have one of several possible roles - but the roles are unfortunately not known to the service, because they are stored in a database. This makes configuring the authorization policy at startup very difficult - if not impossible without dirty workarounds.

The solution to this problem is the [`IAuthorizationPolicyProvider`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authorization.iauthorizationpolicyprovider) interface. Among others, it defines the function `Task<AuthorizationPolicy?> GetPolicyAsync (string policyName)` which creates an `AuthorizationPolicy` for a given `policyName`. The function is asynchronous, which means that it can run _any kind of code_ to create the desired policy, including database lookups. We can use this interface to create our desired `CanEditContent` policy like this:

```cs
public sealed class MyPolicyProvider : IAuthorizationPolicyProvider
{
    private readonly IDbConnector _db;

    public MyPolicyProvider(IDbConnector db)
    {
        _db = db;
    }
    
    public async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (policyName == "CanEditContent")
        {
            // Fetch the required roles for the policy from a fictive data source.
            string[] roles = await _db.GetRolesForCanEditContentPolicy();

            // Build the policy.
            AuthorizationPolicy policy = new AuthorizationPolicyBuilder()
                .RequireRole(roles)
                .Build();
            
            return policy;
        }

        // For the moment, do not create any policy if the names do not match.
        // Note that this is typically not what you want. This will be fixed later on.
        return null;
    }

    // These two functions will be implemented later on.
    // For the moment, they are required for getting the code to compile.
    public Task<AuthorizationPolicy> GetDefaultPolicyAsync() =>
        throw new NotImplementedException();

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() =>
        throw new NotImplementedException();
}
```

Note that the policy provider can, and indeed does, leverage dependency injection. This is because custom `IAuthorizationPolicyProvider` implementations are normally registered in the service's DI container:

```cs
// In the startup file:
services.AddSingleton<IAuthorizationPolicyProvider, MyPolicyProvider>();
```

One issue remains though: Internally, ASP.NET only supports a single registered `IAuthorizationPolicyProvider`. By registering our custom implementation, we are essentially overwriting ASP.NET's [default implementation](https://learn.microsoft.com/de-de/dotnet/api/microsoft.aspnetcore.authorization.defaultauthorizationpolicyprovider). This is a big problem, because it means that any additional policy registered via "traditional" `AddAuthorization(...)` startup code will no longer work. This can be solved by "merging" the custom provider with the default one:

```cs
public sealed class MyPolicyProvider : IAuthorizationPolicyProvider
{
    private readonly IDbConnector _db;
    private readonly DefaultAuthorizationPolicyProvider _defaultProvider;

    // ❇️ New: Create a DefaultAuthorizationPolicyProvider instance.
    // It requires IOptions<AuthorizationOptions> which can simply be injected.
    public MyPolicyProvider(IDbConnector db, IOptions<AuthorizationOptions> authorizationOptions)
    {
        _db = db;
        _defaultProvider = new DefaultAuthorizationPolicyProvider(authorizationOptions);
    }

    public async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (policyName == "CanEditContent")
        {
            // Fetch the required roles for the policy from a fictive data source.
            string[] roles = await _db.GetRolesForCanEditContentPolicy();

            // Build the policy.
            AuthorizationPolicy policy = new AuthorizationPolicyBuilder()
                .RequireRole(roles)
                .Build();

            return policy;
        }

        // ❇️ New: If no custom policy matches the name, forward the call to ASP.NET's default implementation.
        return await _defaultProvider.GetPolicyAsync(policyName);
    }

    // ❇️ New: Return ASP.NET's default and fallback policies when requested.
    public Task<AuthorizationPolicy> GetDefaultPolicyAsync() =>
        _defaultProvider.GetDefaultPolicyAsync();

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() =>
        _defaultProvider.GetFallbackPolicyAsync();
}
```

This code fragment is fully functional - it builds the custom `CanEditContent` policy by querying a database and falls back to ASP.NET's defaults whenever another policy is requested. In more involved scenarios, it's even possible to use custom logic in `GetDefaultPolicyAsync` and `GetFallbackPolicyAsync`.

## Other Use-Cases

`IAuthorizationPolicyProvider` is powerful. Apart from being able to asynchronously create policies, it can also be used to dynamically create parametrized authorization policies.

For example, let's assume that we want to build a policy provider which, given the policy name `Roles:Admin,User`,  creates a policy that requires the user to have either the `Admin` or the `User` role. Or, more generically, we want a custom `IAuthorizationPolicyProvider` which takes a policy name starting with `Roles:` and creates a policy which requires the user to have all roles specified after the colon[^1]. This can easily be achieved like this:

```cs
public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
{
    var rolesPrefix = "Roles:";

    if (policyName.StartsWith(rolesPrefix))
    {
        var roles = policyName
            .Substring(rolesPrefix.Length)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (roles.Length == 0)
        {
            throw new ArgumentException("When starting with 'Roles:', at least one non-whitespace role must be provided.", nameof(policyName));
        }

        var policy = new AuthorizationPolicyBuilder()
            .RequireRole(roles)
            .Build();

        return Task.FromResult<AuthorizationPolicy?>(policy);
    }

    return _defaultProvider.GetPolicyAsync(policyName);
}
```

[MSDN's documentation on `IAuthorizationPolicyProvider`s](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/iauthorizationpolicyprovider) also shows a compelling example where a custom policy provider is used to dynamically create a parametrized `MinimumAge` policy where the minimum age is specified in the policy name.

## Conclusion

If you notice that your project's authorization policy setup does not scale anymore, it might be worth it to look into whether a custom `IAuthorizationPolicyProvider` implementation can help you. Further resources about this interface and authorization policies in general can be found here:

- [The `IAuthorizationPolicyProvider` interface](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authorization.iauthorizationpolicyprovider)
- [Custom `IAuthorizationPolicyProvider`s on MSDN](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/iauthorizationpolicyprovider)
- [GitHub sample by Microsoft](https://github.com/dotnet/aspnetcore/tree/v3.1.3/src/Security/samples/CustomPolicyProvider)

[^1]: This is inspired by a real-world project using [YARP](https://microsoft.github.io/reverse-proxy/) to build a custom reverse proxy service. YARP typically uses [JSON configuration files](https://microsoft.github.io/reverse-proxy/articles/config-files.html#all-config-properties) to define the proxied endpoints. Each endpoint inside the configuration file can be assigned a user-defined `AuthorizationPolicy`. By providing the required roles via the policy name, the service's codebase itself does not need to be updated when role assignments change.
