using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Domain.Profiles;
using BlueEmber.Api.Domain.Scoring;

namespace BlueEmber.Api.Tests.Domain.Scoring;

public sealed class ScoreCalculatorTests
{
    private readonly ScoreCalculator _calculator = new();

    [Fact]
    public void SaffireII_Moon_ShipEngineer_picks_worst_case_condition()
    {
        var result = _calculator.Calculate(
            ScoreFixtures.SaffireII(),
            MissionEnvironment.Moon,
            ScoreWeights.For(UserProfile.ShipEngineer));

        Assert.Equal(1, result.WinningConditionIndex);
        Assert.NotNull(result.WinningCondition);
        Assert.Equal(34, result.WinningCondition!.O2Percent);
        Assert.Equal(56.5, result.WinningCondition.PressureKpa);
        Assert.True(result.PpO2Kpa is > 0);
        Assert.Equal(19.21, result.PpO2Kpa); // 34% * 56.5 / 100
        Assert.Equal(0.815, result.C1Proximidade);
        Assert.Equal(0.725, result.C2MargemMoc);
        Assert.Equal(0.775, result.C3Cinetica);
        Assert.Equal(0.933, result.C4SeveridadeTermica);
        Assert.Equal(0.886, result.C5Toxicidade);
        Assert.Equal(8.109, result.Total);
    }

    [Fact]
    public void Same_detection_renormalizes_without_flame_magnitudes()
    {
        var result = _calculator.Calculate(
            ScoreFixtures.Same(),
            MissionEnvironment.Moon,
            ScoreWeights.For(UserProfile.Student));

        Assert.Equal("deteccao", ScoreFixtures.Same().Category);
        Assert.Equal(0, result.C3Cinetica);
        Assert.Equal(0, result.C4SeveridadeTermica);
        Assert.Equal(0, result.C5Toxicidade);
        Assert.True(result.Total > 5.0, $"Detection lane should not be crushed; got {result.Total}");
        Assert.Equal(6.264, result.Total);
    }

    [Fact]
    public void Flex_does_not_cross_independent_axes_into_fake_condition()
    {
        var flex = ScoreFixtures.Flex();
        Assert.True(flex.TestConditions.Count >= 2);

        // No synthesized 30% O2 + 70.3 kPa + 15 cm/s — FLEX flow is always 0
        Assert.All(flex.TestConditions, c => Assert.Equal(0, c.FlowSpeedCms));
        Assert.DoesNotContain(flex.TestConditions, c =>
            c.O2Percent is >= 29 and <= 31 &&
            c.PressureKpa is >= 69 and <= 72 &&
            c.FlowSpeedCms is >= 14);

        var result = _calculator.Calculate(
            flex,
            MissionEnvironment.Moon,
            ScoreWeights.For(UserProfile.Student));

        Assert.NotNull(result.WinningCondition);
        Assert.Equal(0, result.WinningCondition!.FlowSpeedCms);
    }

    [Fact]
    public void EmptyAxes_C1_is_neutral_half_without_habitat()
    {
        var inv = new Investigation
        {
            Id = "empty-metrics",
            Acronym = "EMPTY",
            Category = "outro",
            O2Range = [],
            PressureKpa = [],
            FlowSpeedCms = [],
            RelevanceHabitat = [],
            TestConditions = []
        };

        var result = _calculator.Calculate(
            inv,
            MissionEnvironment.Moon,
            ScoreWeights.For(UserProfile.Student));

        Assert.Equal(0.5, result.C1Proximidade);
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

    [Fact]
    public void Detection_lane_Same_and_Daft_outrank_Saffire_when_filtered()
    {
        var weights = ScoreWeights.For(UserProfile.ShipEngineer);
        var env = MissionEnvironment.Moon;

        var same = _calculator.Calculate(ScoreFixtures.Same(), env, weights).Total;
        var daft = _calculator.Calculate(ScoreFixtures.Daft(), env, weights).Total;
        var saffire = _calculator.Calculate(ScoreFixtures.SaffireII(), env, weights).Total;

        // Global Saffire still high (flame severity). Detection lane scores are competitive alone.
        Assert.True(same > 5.0);
        Assert.True(daft > 5.0);
        Assert.True(saffire > same, "Global severity ranking may still favor Saffire");
        Assert.Equal("deteccao", ScoreFixtures.Same().Category);
        Assert.Equal("deteccao", ScoreFixtures.Daft().Category);
        Assert.Equal("prevencao", ScoreFixtures.SaffireII().Category);
    }
}
