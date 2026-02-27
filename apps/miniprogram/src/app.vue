<script setup lang="ts">
import { onHide, onLaunch, onShow } from "wevu";
import { RpcErrorCode, setRpcErrorHandler } from "@/lib/rpc";

setRpcErrorHandler((error) => {
  if (error.code === RpcErrorCode.FORBIDDEN) {
    const currentPages = getCurrentPages();
    const currentPage = currentPages[currentPages.length - 1];
    const currentRoute = `/${currentPage?.route ?? ""}`;

    if (currentRoute === "/pages/unauthorized/index") {
      return;
    }

    wx.reLaunch({ url: "/pages/unauthorized/index" });
  }
});

defineAppJson({
  pages: [
    "pages/index/index",
    "pages/product/index",
    "pages/resource/index",
    "pages/training/index",
    "pages/mine/index",
    "pages/unauthorized/index",
  ],
  window: {
    navigationBarTitleText: "海纳API | 家族办公室",
    navigationBarBackgroundColor: "#ff2056",
    navigationBarTextStyle: "white",
    backgroundTextStyle: "dark",
  },
  tabBar: {
    color: "#7a7aa0",
    selectedColor: "#ff2056",
    backgroundColor: "#ffffff",
    borderStyle: "white",
    list: [
      {
        pagePath: "pages/index/index",
        text: "首页",
        iconPath: "tabbar/home.png",
        selectedIconPath: "tabbar/home-active.png",
      },
      {
        pagePath: "pages/product/index",
        text: "产品",
        iconPath: "tabbar/product.png",
        selectedIconPath: "tabbar/product-active.png",
      },
      {
        pagePath: "pages/resource/index",
        text: "资源",
        iconPath: "tabbar/resource.png",
        selectedIconPath: "tabbar/resource-active.png",
      },
      {
        pagePath: "pages/training/index",
        text: "培训",
        iconPath: "tabbar/training.png",
        selectedIconPath: "tabbar/training-active.png",
      },
      {
        pagePath: "pages/mine/index",
        text: "我的",
        iconPath: "tabbar/mine.png",
        selectedIconPath: "tabbar/mine-active.png",
      },
    ],
  },
  style: "v2",
  componentFramework: "glass-easel",
  sitemapLocation: "sitemap.json",
});

onLaunch(() => {});

onShow(() => {
  console.log("[reeka-office] app show");
});

onHide(() => {
  console.log("[reeka-office] app hide");
});
</script>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

page {
  font-family: "HarmonyOS Sans", "PingFang SC", "Microsoft YaHei", sans-serif;
  background-color: #f6f7fb;
}
</style>
