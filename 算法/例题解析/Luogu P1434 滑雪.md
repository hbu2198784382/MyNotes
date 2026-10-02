# 题目内容

## 题目描述

Michael 喜欢滑雪。这并不奇怪，因为滑雪的确很刺激。可是为了获得速度，滑的区域必须向下倾斜，而且当你滑到坡底，你不得不再次走上坡或者等待升降机来载你。Michael 想知道在一个区域中最长的滑坡。区域由一个二维数组给出。数组的每个数字代表点的高度。下面是一个例子：
```plain
1   2   3   4   5
16  17  18  19  6
15  24  25  20  7
14  23  22  21  8
13  12  11  10  9
```
一个人可以从某个点滑向上下左右相邻四个点之一，当且仅当高度会减小。在上面的例子中，一条可行的滑坡为 $24-17-16-1$（从 $24$ 开始，在 $1$ 结束）。当然 $25-24-23-\ldots-3-2-1$ 更长。事实上，这是最长的一条。

## 输入格式

输入的第一行为表示区域的二维数组的行数 $R$ 和列数 $C$。下面是 $R$ 行，每行有 $C$ 个数，代表高度（两个数字之间用 $1$ 个空格间隔）。

## 输出格式

输出区域中最长滑坡的长度。

## 输入输出样例 #1

### 输入 #1

```
5 5
1 2 3 4 5
16 17 18 19 6
15 24 25 20 7
14 23 22 21 8
13 12 11 10 9

```

### 输出 #1

```
25
```

## 说明/提示

对于 $100\%$ 的数据，$1\leq R,C\leq 100$。

对于任意输入的高度 $h$，满足 $0 \le h \le 10000$，且 $h$ 是整数。


# 思路分析
假设到达点 $A$ 的最长路径长度为 $M(A)$，高于 $A$ 的相邻点集合记作 $near(A)$ ，列出状态转移方程：若 $near(A) \neq \emptyset$，$$M(A)=max_{x\in near(A)}{\{~ M(x) ~\}+1}$$
边界条件：对于 $near(A)=\emptyset$ ，$M(A)=1$。对于所有点的集合 $P$ ，解即为找出 $max_{x\in P}~\{ M(x) \}$ 。由于不好确认 $A$ 的选取顺序，故直接使用[[递归与动态规划#自顶向下法]]进行搜索。

# 解法代码
```cpp
#include <bits/stdc++.h>
using namespace std;

int s(int pos,int* dp,int* h,int r,int c){
    if(dp[pos]>=0) return dp[pos];
    int i = pos/c,j = pos%c,max = -1,temp;
    int near[4],cnt=0;
    // get near
    if(i > 0 && h[pos-c]>h[pos]) near[cnt++] = pos-c; //up
    if(i < r-1 && h[pos+c]>h[pos]) near[cnt++] = pos+c; //down
    if(j > 0 && h[pos-1]>h[pos]) near[cnt++] = pos-1; //left
    if(j < c-1 && h[pos+1]>h[pos]) near[cnt++] = pos+1; //down
    // calc
    if(cnt==0){dp[pos] = 1;return 1;}
    while(cnt>0){
        temp = s(near[--cnt],dp,h,r,c);
        if(temp > max) max = temp;
    }
    dp[pos] = max+1;return max+1;
}

int main(){
    int r,c,max=-1,temp;scanf("%d%d",&r,&c);
    int* h = new int [r*c]; //row i,col j -> i*c+j
    for(int i = 0;i < r*c;i++) scanf("%d",&h[i]);
    int* dp = new int [r*c];memset(dp,-1,sizeof(int)*r*c);
    for(int i = 0;i < r*c;i++){
        temp = s(i,dp,h,r,c);if(temp>max)max=temp;
    }
    printf("%d",max);
    return 0;
}
```
