using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Domain.Profiles;
using BlueEmber.Api.Domain.Scoring;

namespace BlueEmber.Api.Tests.Domain.Scoring;

public sealed class ScoreCalculatorTests
{
    private readonly ScoreCalculator _calculator = new();

    [Fact]
    public void SaffireII_Moon_ShipEngineer_matches_golden()
    {
        var result = _calculator.Calculate(
            ScoreFixtures.SaffireII(),
            MissionEnvironment.Moon,
            ScoreWeights.For(UserProfile.ShipEngineer));

        Assert.Equal(0.915, result.C1Proximidade);
        Assert.Equal(0.725, result.C2MargemMoc);
        Assert.Equal(0.775, result.C3Cinetica);
        Assert.Equal(0.933, result.C4SeveridadeTermica);
        Assert.Equal(0.886, result.C5Toxicidade);
        Assert.Equal(8.309, result.Total);
    }

    [Fact]
    public void Same_Moon_Student_matches_golden()
    {
        var result = _calculator.Calculate(
            ScoreFixtures.Same(),
            MissionEnvironment.Moon,
            ScoreWeights.For(UserProfile.Student));

        Assert.Equal(0.803, result.C1Proximidade);
        Assert.Equal(0.450, result.C2MargemMoc);
        Assert.Equal(0, result.C3Cinetica);
        Assert.Equal(0.017, result.C4SeveridadeTermica);
        Assert.Equal(0.071, result.C5Toxicidade);
        Assert.Equal(2.682, result.Total);
    }

    [Fact]
    public void Flex_Moon_Student_matches_golden()
    {
        var result = _calculator.Calculate(
            ScoreFixtures.Flex(),
            MissionEnvironment.Moon,
            ScoreWeights.For(UserProfile.Student));

        Assert.Equal(0.729, result.C1Proximidade);
        Assert.Equal(0.850, result.C2MargemMoc);
        Assert.Equal(0, result.C3Cinetica);
        Assert.Equal(0.067, result.C4SeveridadeTermica);
        Assert.Equal(0.121, result.C5Toxicidade);
        Assert.Equal(3.534, result.Total);
    }

    [Fact]
    public void EmptyMetricLists_Moon_Student_C1_is_perfect_without_habitat()
    {
        var inv = new Investigation
        {
            Id = "empty-metrics",
            Acronym = "EMPTY",
            O2Range = [],
            PressureKpa = [],
            FlowSpeedCms = [],
            FlameSpreadRateMms = 0,
            MocPercent = 30,
            HrrKw = 0,
            CoPpm = 0,
            RelevanceHabitat = []
        };

        var result = _calculator.Calculate(
            inv,
            MissionEnvironment.Moon,
            ScoreWeights.For(UserProfile.Student));

        Assert.Equal(1.0, result.C1Proximidade);
    }

    [Fact]
    public void HabitatBoost_increases_C1_when_metrics_are_offset()
    {
        var withoutHabitat = ScoreFixtures.Same();
        withoutHabitat.RelevanceHabitat = [];

        var withHabitat = ScoreFixtures.Same();

        var weights = ScoreWeights.For(UserProfile.Student);
        var c1Without = _calculator.Calculate(withoutHabitat, MissionEnvironment.Moon, weights).C1Proximidade;
        var c1With = _calculator.Calculate(withHabitat, MissionEnvironment.Moon, weights).C1Proximidade;

        Assert.True(c1With > c1Without);
        Assert.Equal(0.05, Math.Round(c1With - c1Without, 3));
    }

    [Fact]
    public void Moon_ShipEngineer_SaffireOrder_II_gt_III_gt_I()
    {
        var weights = ScoreWeights.For(UserProfile.ShipEngineer);
        var env = MissionEnvironment.Moon;

        var totalII = _calculator.Calculate(ScoreFixtures.SaffireII(), env, weights).Total;
        var totalIII = _calculator.Calculate(ScoreFixtures.SaffireIii(), env, weights).Total;
        var totalI = _calculator.Calculate(ScoreFixtures.SaffireI(), env, weights).Total;

        Assert.True(totalII > totalIII, $"Expected SAFFIRE-II ({totalII}) > SAFFIRE-III ({totalIII})");
        Assert.True(totalIII > totalI, $"Expected SAFFIRE-III ({totalIII}) > SAFFIRE-I ({totalI})");
    }
}
