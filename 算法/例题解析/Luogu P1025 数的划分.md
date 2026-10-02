# 题目内容

## 题目描述

将整数 $n$ 分成 $k$ 份，且每份不能为空，任意两个方案不相同（不考虑顺序）。

例如：$n=7$，$k=3$，下面三种分法被认为是相同的。

$1,1,5$；   
$1,5,1$；   
$5,1,1$。

问有多少种不同的分法。

## 输入格式

$n,k$（$6<n \le 200,2  \le k  \le  6$）。

## 输出格式

$1$ 个整数，即不同的分法。

## 输入输出样例 #1

### 输入 #1

```
7 3

```

### 输出 #1

```
4

```

## 说明/提示

四种分法为：  
$1,1,5$；  
$1,2,4$；  
$1,3,3$；  
$2,2,3$。

**【题目来源】**

NOIP 2001 提高组第二题


# 思路分析

## 解法 1

首先考虑使用[[深度优先搜素算法]]。
**为了解决本题目的消序问题：因为排序不同的解法视为相同解法，我们假定解法排序从小到大。** 这样就保证了解的唯一性。

因此，就可以得到基础的dfs解法
```cpp
#include <bits/stdc++.h>
using namespace std;
int ans = 0;
int* temp = new int [6];
void dfs(int n,int k,int depth){
	// border
	if(n == 0 && k == 0) {ans++;return;}
	if(n < k || k == 0) return;
	// dfs
	for(int i = 1;i <= n;i++){
		temp[depth] = i;
		if(depth == 0 || i >= temp[depth-1]) dfs(n-i,k-1,depth+1);
	}
}

int main(){
	int n,k;
    scanf("%d%d",&n,&k);
    dfs(n,k,0);
    printf("%d",ans);
	return 0;
}
```

![[Pasted image 20260906194016.png]]

在测试过程中，我们注意到存在超时问题，现在需要进行[[深度优先搜素算法#算法优化：剪枝|剪枝操作]]：

由于我们假设解法排序是递增的，用$a_{1}\leq a_{2}\leq \dots \leq a_{k}$表示，且$a_{1}+a_{2}+\dots+a_{k}=n$
则有$ka_{1}\leq n$，即$a_{1} \leq \frac{n}{k}$。

综上，添加剪枝条件，得到
```cpp
#include <bits/stdc++.h>
using namespace std;
int ans = 0;
int* temp = new int [6];
void dfs(int n,int k,int depth){
	// border
	if(n == 0 && k == 0) {ans++;return;}
	if(n < k || k == 0) return;
	// dfs
	for(int i = 1;i <= n;i++){
		temp[depth] = i;
		if(depth == 0 || (i >= temp[depth-1] && i <= n/k)) dfs(n-i,k-1,depth+1);
	}
}

int main(){
	int n,k;
    scanf("%d%d",&n,&k);
    dfs(n,k,0);
    printf("%d",ans);
	return 0;
}
```

![[Pasted image 20260906195040.png]]

## 解法 2

同时，本题也可以考虑使用[[递归与动态规划]]

同样假设解法是递增排序的,用$a_{1}\leq a_{2}\leq \dots \leq a_{k}$表示，且$a_{1}+a_{2}+\dots+a_{k}=n$。假设解为$f(n,k)$
若$a_{1}=1$，则$a_{2}+a_{3}+\dots+a_{k}=n-1$，等价于求$f(n-1,k-1)$。
若$a_{1}>1$，由于递增排列，$a_{2},a_{3},\dots,a_{k}$均大于1，假设$b_{k}=a_{k}-1$，则$b_{k}>0$恒成立。且$b_{1}+b_{2}+\dots+b_{k}=n-k$，等价于求$f(n-k,k)$。
综上，列出转移方程（当$n>k$时）
$$f(n,k)=f(n-1,k-1)+f(n-k,k)$$

同时边界条件：
1. $f(n,1)=n$ 
2. 当$n<k$时，$f(n,k)=0$ 
3. 当$n=k$时，$f(n,k)=1$ （仅有全部为1一种分法，本条件可以省略）

```cpp
#include <bits/stdc++.h>
using namespace std;
int split(int n,int k,int** dp){
    if(dp[n][k] >= 0) return dp[n][k];
    int ans = 0;
    if(k == 1) ans = 1;
    else if(n < k) ans = 0;
    else if(n >= k) ans = split(n-1,k-1,dp)+split(n-k,k,dp);
    dp[n][k] = ans; return ans;
}
int main(){
    int n,k;
    scanf("%d%d",&n,&k);
    int** dp = new int* [n+1];
    for(int i=0;i<=n;i++){
        dp[i] = new int [k+1];
        for(int j=0;j<=k;j++){
            dp[i][j] = -1;
        }
    }
    printf("%d",split(n,k,dp));
    return 0;
}
```