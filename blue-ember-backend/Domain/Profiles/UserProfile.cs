namespace BlueEmber.Api.Domain.Profiles;

public enum UserProfile
{
    Student,
    Researcher,
    ShipEngineer
}

public sealed record ScoreWeights(double W1, double W2, double W3, double W4, double W5)
{
    public static ScoreWeights For(UserProfile profile) => profile switch
    {
        UserProfile.ShipEngineer => new(0.20, 0.25, 0.25, 0.15, 0.15),
        UserProfile.Researcher => new(0.35, 0.1625, 0.1625, 0.1625, 0.1625),
        _ => new(0.20, 0.20, 0.20, 0.20, 0.20)
    };

    public static ScoreWeights? TryFromOverrides(double? w1, double? w2, double? w3, double? w4, double? w5)
    {
        if (w1 is null && w2 is null && w3 is null && w4 is null && w5 is null)
            return null;
        return new(w1 ?? 0.2, w2 ?? 0.2, w3 ?? 0.2, w4 ?? 0.2, w5 ?? 0.2);
    }
}

public sealed record ProfileInfo(string Id, string Label, ScoreWeights Weights);

public static class UserProfileCatalog
{
    public static IReadOnlyList<ProfileInfo> List() =>
    [
        new("Student", "Estudante", ScoreWeights.For(UserProfile.Student)),
        new("Researcher", "Pesquisador", ScoreWeights.For(UserProfile.Researcher)),
        new("ShipEngineer", "Engenheiro de nave", ScoreWeights.For(UserProfile.ShipEngineer))
    ];

    public static bool TryParse(string? value, out UserProfile profile)
    {
        profile = UserProfile.Student;
        if (string.IsNullOrWhiteSpace(value))
            return true;

        return Enum.TryParse(value, ignoreCase: true, out profile);
    }
}
