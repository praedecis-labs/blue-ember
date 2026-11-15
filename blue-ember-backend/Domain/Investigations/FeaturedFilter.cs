namespace BlueEmber.Api.Domain.Investigations;

public static class FeaturedFilter
{
    public static bool RestrictToFireSafety(bool? featured) => featured is not false;
}
