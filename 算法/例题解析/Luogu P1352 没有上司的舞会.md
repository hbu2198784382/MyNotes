# 题目内容

## 题目描述

某大学有 $n$ 个职员，编号为 $1\ldots n$。

他们之间有从属关系，也就是说他们的关系就像一棵以校长为根的树，父结点就是子结点的直接上司。

现在有个周年庆宴会，宴会每邀请来一个职员都会增加一定的快乐指数 $r_i$，但是呢，如果某个职员的直接上司来参加舞会了，那么这个职员就无论如何也不肯来参加舞会了。

所以，请你编程计算，邀请哪些职员可以使快乐指数最大，求最大的快乐指数。

## 输入格式

输入的第一行是一个整数 $n$。

第 $2$ 到第 $(n + 1)$ 行，每行一个整数，第 $(i+1)$ 行的整数表示 $i$ 号职员的快乐指数 $r_i$。

第 $(n + 2)$ 到第 $2n$ 行，每行输入一对整数 $l, k$，代表 $k$ 是 $l$ 的直接上司。

## 输出格式

输出一行一个整数代表最大的快乐指数。

## 输入输出样例 #1

### 输入 #1

```
7
1
1
1
1
1
1
1
1 3
2 3
6 4
7 4
4 5
3 5

```

### 输出 #1

```
5

```

## 说明/提示

#### 数据规模与约定

对于 $100\%$ 的数据，保证 $1\leq n \leq 6 \times 10^3$，$-128 \leq r_i\leq 127$，$1 \leq l, k \leq n$，且给出的关系一定是一棵树。

# 思路分析

假设 $f(i,1)$ 表示以职员 $i$ 为根节点形成树，且职员 $i$ 要参加时的最大快乐指数和；$f(i,0)$ 表示职员 $i$ 不参加时的最大快乐指数和。

现在尝试列出[[递归与动态规划#状态转移方程|状态转移方程]]
当职员 $i$ 要去时，其子节点职员一定不去。因此有$$f(i,1)=r_{i} + \sum_{k}^{k \in child(i)}f(k,0)$$
当职员 $i$ 不去时，其子节点职员可以选择去，也可以选择不去，因此有$$f(i,0)=\sum_{k}^{k \in child(i)}max(f(k,1),f(k,0))$$
边界条件：对于所有的叶节点职员，$f(i,0)=0,f(i,1)=r_{i}$


因此设计dp表，共两行，分别为去（1）与不去（0）的状态。
一共n列，由于不好确认填表的顺序，使用[[递归与动态规划#自顶向下法|自顶向下法]]计算。


## 题解

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MAXN = 6005;
int n;
int happy[MAXN];
vector<int> children[MAXN];
int dp0[MAXN], dp1[MAXN]; // dp0: 不选当前节点, dp1: 选当前节点

int dfs(int u, bool take) {
    if (take) {
        if (dp1[u] != -1) return dp1[u];
        int res = happy[u];
        for (int v : children[u]) {
            res += dfs(v, false); // 选了 u，子节点不能选
        }
        dp1[u] = res;
        return res;
    } else {
        if (dp0[u] != -1) return dp0[u];
        int res = 0;
        for (int v : children[u]) {
            res += max(dfs(v, true), dfs(v, false)); // 不选 u，子节点可选可不选
        }
        dp0[u] = res;
        return res;
    }
}

int main() {
    scanf("%d", &n);
    for (int i = 1; i <= n; ++i) scanf("%d", &happy[i]);

    // 初始化记忆化数组
    memset(dp0, -1, sizeof(dp0));
    memset(dp1, -1, sizeof(dp1));

    int fa[MAXN] = {0}; // 记录父节点，用于找根

    for (int i = 0; i < n - 1; ++i) {
        int l, k;
        scanf("%d%d", &l, &k); // l 的下属是 k？原题输入：l 的上级是 k
        children[k].push_back(l);
        fa[l] = k;
    }

    // 找根节点（没有上级）
    int root = 1;
    while (fa[root] != 0) root++;

    int ans = max(dfs(root, true), dfs(root, false));
    printf("%d\n", ans);

    return 0;
}
```