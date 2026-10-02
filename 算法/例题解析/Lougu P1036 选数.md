# 题目内容

## 题目描述

已知 $n$ 个整数 $x_1,x_2,\cdots,x_n$，以及 $1$ 个整数 $k$（$k<n$）。从 $n$ 个整数中任选 $k$ 个整数相加，可分别得到一系列的和。例如当 $n=4$，$k=3$，$4$ 个整数分别为 $3,7,12,19$ 时，可得全部的组合与它们的和为：

$3+7+12=22$

$3+7+19=29$

$7+12+19=38$

$3+12+19=34$

现在，要求你计算出和为素数共有多少种。

例如上例，只有一种的和为素数：$3+7+19=29$。

## 输入格式

第一行两个空格隔开的整数 $n,k$（$1 \le n \le 20$，$k<n$）。

第二行 $n$ 个整数，分别为 $x_1,x_2,\cdots,x_n$（$1 \le x_i \le 5\times 10^6$）。

## 输出格式

输出一个整数，表示种类数。

## 输入输出样例 #1

### 输入 #1

```
4 3
3 7 12 19

```

### 输出 #1

```
1

```

## 说明/提示

**【题目来源】**

NOIP 2002 普及组第二题

# 题目分析

容易得到共有 $C_{n}^k$ 种选法，但是如何列举出所有的选择，并且去除重复呢？

采用[[深度优先搜素算法]]的思路，假设第一次选择的数字为树的根节点，每做一次选择，就给上一次选择增加一个子节点。以n=4为例

![[Excalidraw/Drawing 2026-09-10 19.57.16.excalidraw]]

每一个节点都对应一个选择方法，从树根依次到此节点即为选择方式。节点的深度就是选择的数量。（这还不是所有情况，图中仅仅列举出了第一个数选择A\[0\]的选法）

现在解决了列举的问题，但是发现存在大量重复。因此进行[[深度优先搜素算法#算法优化：剪枝|剪枝优化]]。
**假设每次选择子节点，都只能选择下标比现在更大的数。**
那么就可以化简为：

![[Drawing 2026-09-10 20.16.16.excalidraw]]

发现现在所有的节点都对应独特的一个选择方法，只需要遍历一次即可。而且dfs在深度等于选择数量时结束。写出dfs代码：

```cpp
void dfs(int now,int depth,int sum){
    if(depth == k){
        if(isprime(sum)) ans++;
        return;
    }
    for(int i = now + 1;i < n;i++){
        dfs(i,depth+1,sum+arr[i]);
    }
}
```

> [!question] 思考
> 在主函数中，应该如何填写初始参数？

一种很巧妙的方式是：`dfs(-1,0,0)`。


# 题解

```cpp
#include <bits/stdc++.h>
using namespace std;
  
int ans = 0;
int arr[21];
int k,n;

bool isprime(int x){
    if(x==1) return false;
    if(x==2) return true;
    for(int i = 2;i*i <= x;i++){
        if(x%i == 0) return false;
    }return true;
}

void dfs(int now,int depth,int sum){
    if(depth == k){
        if(isprime(sum)) ans++;
        return;
    }
    for(int i = now + 1;i < n;i++){
        dfs(i,depth+1,sum+arr[i]);
    }
}
int main(){
    scanf("%d%d",&n,&k);
    for(int i = 0;i < n;i++)scanf("%d",&arr[i]);
    dfs(-1,0,0);
    printf("%d",ans);
    return 0;
}
```

