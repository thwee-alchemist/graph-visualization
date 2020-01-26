#pragma once

#ifndef SETTINGS
#define SETTINGS

namespace sc {

  class Settings{
    public:
      Settings(
        double _attraction,
        double _repulsion,
        double _epsilon, 
        double _inner_distance,
        double _friction, 
        double _gravity,
        double _time_dilation,
        double _dampening,
        double _drag,
        double _theta
      );

      double get_dampening() const;
      void set_dampening(double val);

      double get_attraction() const;
      void set_attraction(double val);

      double get_repulsion() const;
      void set_repulsion(double val);

      double get_epsilon() const;
      void set_epsilon(double val);

      double get_inner_distance() const;
      void set_inner_distance(double val);

      double get_friction() const;
      void set_friction(double val);

      double get_gravity() const;
      void set_gravity(double val);

      double get_time_dilation() const;
      void set_time_dilation(double val);

      double get_drag() const;
      void set_drag(double val);

      double get_theta() const;
      void set_theta(double val);

      double dampening;
      double repulsion;
      double epsilon;
      double inner_distance;
      double attraction;
      double friction;
      double gravity;
      double time_dilation;
      double drag;
      double theta;
  };
}

#endif