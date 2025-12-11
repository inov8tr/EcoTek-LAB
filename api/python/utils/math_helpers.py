def mean(values):
    if not values:
        return 0
    return sum(values) / len(values)


def clamp(value, low, high):
    return max(low, min(high, value))
