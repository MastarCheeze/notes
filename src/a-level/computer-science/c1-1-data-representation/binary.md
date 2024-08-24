# Binary

> Base 2
> 0 and 1

Computers can only process binary
(transistors can only store 0 and 1)

## Negative numbers

**One's complement**: Invert each digit
**Two's complement**: Invert each digit, add 1 to rightmost bit

| 90                      | `01011010` |
| ----------------------- | :--------: |
| -90 in one's complement | `10100101` |
| -90 in two's complement | `10100110` |

## Addition

$$
\begin{align*}
  0 + 0 &= 0 \\
  1 + 0 &= 1 \\
  1 + 1 &= 10 \\
  1 + 1 + 1 &= 11
\end{align*}
$$

Overflow error: calculated number is larger than storage space

## Bit shift

|         Left shift `<<`          |         Right shift `>>`          |
| :------------------------------: | :-------------------------------: |
|      Moves bits to the left      |      Moves bits to the right      |
| Most significant bits (MSB) lost | Least significant bits (LSB) lost |
|      Multiplies number by 2      |        Divides number by 2        |
